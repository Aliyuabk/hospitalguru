<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Drug;
use App\Models\PharmacySetting;
use App\Models\Stock;
use App\Models\StockTransfer;
use App\Models\StockCount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $low = PharmacySetting::valueFor('low_stock_threshold', 20);
        $days = PharmacySetting::valueFor('expiry_warning_days', 30);
        $query = Stock::with(['drug', 'department', 'supplier'])->where('quantity', '>', 0);

        if ($request->user()->role === 'pharmacy_staff') {
            $query->where('department_id', $request->user()->department_id ?? 0);
        } elseif ($request->filled('department_id')) {
            $query->where('department_id', $request->integer('department_id'));
        }
        if ($request->boolean('low_stock')) $query->where('quantity', '<', $low);
        if ($request->boolean('expiring')) $query->whereDate('expiry_date', '<=', now()->addDays($days));

        return $query->orderBy('expiry_date')->paginate(50);
    }

    public function summary(Request $request)
    {
        $user = $request->user();
        $low = PharmacySetting::valueFor('low_stock_threshold', 20);
        $days = PharmacySetting::valueFor('expiry_warning_days', 30);
        $stocks = Stock::query();
        if ($user->role === 'pharmacy_staff') $stocks->where('department_id', $user->department_id ?? 0);
        $departments = Department::where('is_active', true);
        if ($user->role === 'pharmacy_staff') $departments->whereKey($user->department_id ?? 0);

        return response()->json([
            'stock_value_naira' => (int) ((clone $stocks)->selectRaw('SUM(quantity * cost_price_naira) as value')->value('value') ?? 0),
            'low_stock_count' => (clone $stocks)->where('quantity', '<', $low)->count(),
            'expiring_count' => (clone $stocks)->whereBetween('expiry_date', [now()->toDateString(), now()->addDays($days)->toDateString()])->count(),
            'low_stock_threshold' => $low,
            'expiry_warning_days' => $days,
            'departments' => $departments->count(),
        ]);
    }

    public function departments(Request $request)
    {
        $query = Department::where('is_active', true)->orderBy('id');
        if ($request->user()->role === 'pharmacy_staff') $query->whereKey($request->user()->department_id ?? 0);
        return $query->get(['id', 'name', 'code', 'type']);
    }

    public function transfers(Request $request)
    {
        return StockTransfer::with(['drug', 'fromDepartment', 'toDepartment', 'creator'])->latest('transferred_at')->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'drug_id' => 'required|exists:drugs,id', 'department_id' => 'required|exists:departments,id',
            'batch_no' => 'required|string|max:100', 'quantity' => 'required|integer|min:1',
            'cost_price_naira' => 'required|integer|min:0', 'selling_price_naira' => 'required|integer|min:0',
            'expiry_date' => 'required|date|after:today', 'supplier_id' => 'nullable|exists:suppliers,id',
        ]);
        return DB::transaction(function () use ($data) {
            Department::whereKey($data['department_id'])->lockForUpdate()->firstOrFail();
            abort_if(StockCount::where('department_id', $data['department_id'])->where('status', 'counting')->exists(), 423, 'Stock receiving is paused while this pharmacy unit is being physically counted.');
            return Stock::create($data);
        });
    }

    public function transfer(Request $request)
    {
        $data = $request->validate([
            'from_department_id' => 'required|exists:departments,id', 'to_department_id' => 'required|different:from_department_id|exists:departments,id',
            'drug_id' => 'required|exists:drugs,id', 'stock_id' => 'required|exists:stocks,id', 'quantity' => 'required|integer|min:1',
        ]);
        return DB::transaction(function () use ($data, $request) {
            Department::whereIn('id', [$data['from_department_id'], $data['to_department_id']])->orderBy('id')->lockForUpdate()->get();
            abort_if(StockCount::whereIn('department_id', [$data['from_department_id'], $data['to_department_id']])->where('status', 'counting')->exists(), 423, 'Stock transfers are paused while a pharmacy unit is being physically counted.');
            $source = Stock::lockForUpdate()->findOrFail($data['stock_id']);
            abort_unless($source->drug_id == $data['drug_id'] && $source->department_id == $data['from_department_id'] && $source->quantity >= $data['quantity'], 422, 'Source batch does not have enough stock.');
            $source->decrement('quantity', $data['quantity']);
            $target = Stock::firstOrCreate(
                ['drug_id' => $source->drug_id, 'department_id' => $data['to_department_id'], 'batch_no' => $source->batch_no],
                ['quantity' => 0, 'cost_price_naira' => $source->cost_price_naira, 'selling_price_naira' => $source->selling_price_naira, 'expiry_date' => $source->expiry_date, 'supplier_id' => $source->supplier_id]
            );
            $target->increment('quantity', $data['quantity']);
            return StockTransfer::create([
                'transfer_no' => 'TRF-' . now()->format('YmdHis') . '-' . random_int(10, 99),
                'from_department_id' => $data['from_department_id'], 'to_department_id' => $data['to_department_id'],
                'drug_id' => $data['drug_id'], 'from_stock_id' => $source->id, 'batch_no' => $source->batch_no,
                'quantity' => $data['quantity'], 'created_by' => $request->user()->id, 'status' => 'completed', 'transferred_at' => now(),
            ]);
        });
    }
}
