<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Stock;
use App\Models\StockCount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockCountController extends Controller
{
    public function discovery()
    {
        return response()->json(['service' => 'bkd-pharmacy-api', 'api_base' => '/api']);
    }

    public function active(Request $request)
    {
        $departmentId = $request->user()->role === 'pharmacy_staff'
            ? $request->user()->department_id
            : ($request->integer('department_id') ?: $request->user()->department_id);
        if (!$departmentId) return response()->json(null);
        return StockCount::with('department:id,name')->where('department_id', $departmentId)->where('status', 'counting')->first(['id', 'reference', 'department_id', 'started_at']);
    }

    public function index(Request $request)
    {
        $query = StockCount::with(['department:id,name', 'starter:id,name', 'completer:id,name'])->withCount('items');
        if ($request->user()->role === 'pharmacy_staff') $query->where('department_id', $request->user()->department_id ?? 0);
        return $query->latest('started_at')->paginate(30);
    }

    public function show(Request $request, StockCount $stockCount)
    {
        abort_if($request->user()->role === 'pharmacy_staff' && (int) $stockCount->department_id !== (int) $request->user()->department_id, 403);
        return $stockCount->load(['department:id,name', 'starter:id,name', 'completer:id,name', 'items.drug:id,name,sku,unit', 'items.counter:id,name']);
    }

    public function start(Request $request)
    {
        $data = $request->validate(['department_id' => 'required|integer|exists:departments,id']);

        return DB::transaction(function () use ($data, $request) {
            $department = Department::where('is_active', true)->lockForUpdate()->findOrFail($data['department_id']);
            if (StockCount::where('department_id', $department->id)->where('status', 'counting')->lockForUpdate()->exists()) {
                throw ValidationException::withMessages(['department_id' => 'A stock count is already open for this pharmacy unit.']);
            }

            $stocks = Stock::where('department_id', $department->id)->orderBy('id')->lockForUpdate()->get();
            if ($stocks->isEmpty()) {
                throw ValidationException::withMessages(['department_id' => 'There are no stock batches in this pharmacy unit to count.']);
            }
            $count = StockCount::create([
                'reference' => 'CNT-' . now()->format('Ymd-His') . '-' . random_int(100, 999),
                'department_id' => $department->id, 'status' => 'counting',
                'started_by' => $request->user()->id, 'started_at' => now(),
            ]);
            foreach ($stocks as $stock) {
                $count->items()->create([
                    'stock_id' => $stock->id, 'drug_id' => $stock->drug_id,
                    'batch_no' => $stock->batch_no, 'expected_quantity' => $stock->quantity,
                ]);
            }
            return response()->json($count->load(['department:id,name', 'items.drug:id,name,sku,unit']), 201);
        });
    }

    public function record(Request $request, StockCount $stockCount, int $item)
    {
        abort_if($request->user()->role === 'pharmacy_staff' && (int) $stockCount->department_id !== (int) $request->user()->department_id, 403);
        $data = $request->validate(['counted_quantity' => 'required|integer|min:0|max:4294967295']);
        return DB::transaction(function () use ($request, $stockCount, $item, $data) {
            $count = StockCount::whereKey($stockCount->id)->lockForUpdate()->firstOrFail();
            abort_unless($count->status === 'counting', 409, 'This stock count is already closed.');
            $line = $count->items()->whereKey($item)->lockForUpdate()->firstOrFail();
            $line->update(['counted_quantity' => $data['counted_quantity'], 'counted_by' => $request->user()->id, 'counted_at' => now()]);
            return $line->load(['drug:id,name,sku,unit', 'counter:id,name']);
        });
    }

    public function complete(Request $request, StockCount $stockCount)
    {
        abort_unless($stockCount->status === 'counting', 409, 'This stock count is already closed.');
        return DB::transaction(function () use ($request, $stockCount) {
            $count = StockCount::whereKey($stockCount->id)->lockForUpdate()->firstOrFail();
            abort_unless($count->status === 'counting', 409, 'This stock count is already closed.');
            $items = $count->items()->orderBy('id')->lockForUpdate()->get();
            if ($items->isEmpty() || $items->contains(fn ($item) => $item->counted_quantity === null)) {
                throw ValidationException::withMessages(['items' => 'Enter a physical quantity for every batch before completing the count.']);
            }
            foreach ($items as $item) {
                if (!$item->stock_id) continue;
                $stock = Stock::whereKey($item->stock_id)->lockForUpdate()->first();
                if (!$stock || $stock->quantity !== $item->expected_quantity) {
                    throw ValidationException::withMessages(['items' => "Stock changed for {$item->drug->name} batch {$item->batch_no}. Recheck this count before completing it."]);
                }
                $stock->update(['quantity' => $item->counted_quantity]);
            }
            $count->update(['status' => 'completed', 'completed_by' => $request->user()->id, 'completed_at' => now()]);
            return $count->load(['department:id,name', 'starter:id,name', 'completer:id,name', 'items.drug:id,name,sku,unit']);
        });
    }
}
