<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use Illuminate\Http\Request;

class DrugController extends Controller
{
    public function index(Request $request)
    {
        $staffScoped = $request->user()->role === 'pharmacy_staff';
        $departmentId = $staffScoped ? $request->user()->department_id : $request->query('department_id');
        $query = Drug::query()->where('is_active', true)->with(['stocks' => function ($stocks) use ($departmentId, $staffScoped) {
            if ($staffScoped && !$departmentId) $stocks->whereRaw('1 = 0');
            elseif ($departmentId) $stocks->where('department_id', $departmentId);
            $stocks->where('quantity', '>', 0)->whereDate('expiry_date', '>=', now()->toDateString())->orderBy('expiry_date');
        }]);
        if ($search = $request->query('q')) {
            $query->where(fn ($where) => $where->where('name', 'like', "%$search%")
                ->orWhere('sku', 'like', "%$search%")
                ->orWhere('barcode', 'like', "%$search%"));
        }
        return $query->orderBy('name')->paginate(100);
    }

    public function store(Request $request)
    {
        return Drug::create($request->validate([
            'name' => 'required|string|max:255', 'barcode' => 'nullable|string|max:100|unique:drugs',
            'sku' => 'required|string|max:80|unique:drugs', 'category' => 'nullable|string|max:100',
            'unit' => 'required|string|max:50', 'is_active' => 'sometimes|boolean',
        ]));
    }

    public function show(Request $request, Drug $drug)
    {
        $staffScoped = $request->user()->role === 'pharmacy_staff';
        return $drug->load(['stocks' => function ($stocks) use ($request, $staffScoped) {
            if ($staffScoped) $stocks->where('department_id', $request->user()->department_id ?? 0);
            $stocks->with('department');
        }]);
    }

    public function update(Request $request, Drug $drug)
    {
        $drug->update($request->validate([
            'name' => 'sometimes|required|string|max:255', 'barcode' => 'nullable|string|max:100|unique:drugs,barcode,' . $drug->id,
            'sku' => 'sometimes|required|string|max:80|unique:drugs,sku,' . $drug->id, 'category' => 'nullable|string|max:100',
            'unit' => 'sometimes|required|string|max:50', 'is_active' => 'sometimes|boolean',
        ]));
        return $drug;
    }

    public function destroy(Drug $drug)
    {
        abort_if($drug->stocks()->where('quantity', '>', 0)->exists(), 409, 'Drug still has stock.');
        $drug->update(['is_active' => false]);
        return response()->noContent();
    }
}
