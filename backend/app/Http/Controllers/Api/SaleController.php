<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exceptions\OfflineSaleConflictException;
use App\Models\Drug;
use App\Models\Department;
use App\Models\Prescription;
use App\Models\Sale;
use App\Models\Stock;
use App\Models\SyncConflict;
use App\Models\StockCount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function sync(Request $request)
    {
        $data = $request->validate([
            'local_id' => 'required|uuid', 'invoice_no' => 'required|string|max:80',
            'patient_id' => 'nullable|integer|exists:patients,id', 'prescription_id' => 'nullable|integer|exists:prescriptions,id',
            'folder_no' => 'nullable|string|exists:patients,folder_no', 'subtotal_naira' => 'required|integer|min:0',
            'discount_naira' => 'required|integer|min:0', 'total_naira' => 'required|integer|min:0',
            'payment_mode' => 'required|in:Cash,Transfer,NHIS,Staff Credit', 'created_at' => 'required|date',
            'items' => 'required|array|min:1', 'items.*.drug_id' => 'required|integer|exists:drugs,id',
            'items.*.quantity' => 'required|integer|min:1', 'items.*.unit_price_naira' => 'required|integer|min:0',
        ]);

        try {
            $sale = DB::transaction(function () use ($data, $request) {
                $existing = Sale::where('client_sale_id', $data['local_id'])->first();
                if ($existing) return $existing->load('items');
                $department = $request->user()->department_id ?? 2;
                Department::whereKey($department)->lockForUpdate()->firstOrFail();
                if (StockCount::where('department_id', $department)->where('status', 'counting')->exists()) {
                    throw new OfflineSaleConflictException('Sales are paused for this pharmacy unit while a physical stock count is in progress.');
                }
                $patientId = $data['patient_id'] ?? (isset($data['folder_no']) ? \App\Models\Patient::where('folder_no', $data['folder_no'])->value('id') : null);
                $prescription = isset($data['prescription_id']) ? Prescription::with('items')->lockForUpdate()->findOrFail($data['prescription_id']) : null;
                if ($prescription && ((int) $prescription->patient_id !== (int) $patientId || !in_array($prescription->status, ['pending', 'partially_dispensed'], true))) {
                    throw new OfflineSaleConflictException('Prescription does not match this patient or is no longer available.');
                }

                $sale = Sale::create([
                    'invoice_no' => $data['invoice_no'], 'client_sale_id' => $data['local_id'],
                    'patient_id' => $patientId, 'prescription_id' => $prescription?->id,
                    'staff_id' => $request->user()->id, 'department_id' => $department,
                    'subtotal_naira' => $data['subtotal_naira'], 'discount_naira' => $data['discount_naira'],
                    'total_naira' => $data['total_naira'], 'payment_mode' => $data['payment_mode'],
                    'is_synced' => true, 'sold_at' => $data['created_at'],
                ]);

                foreach ($data['items'] as $line) {
                    $drug = Drug::findOrFail($line['drug_id']);
                    $prescriptionItem = $prescription?->items->firstWhere('drug_id', $drug->id);
                    if ($prescription && (!$prescriptionItem || $prescriptionItem->dispensed_quantity + $line['quantity'] > $prescriptionItem->quantity)) {
                        throw new OfflineSaleConflictException("{$drug->name} quantity exceeds the prescription balance.");
                    }
                    $stock = Stock::where('drug_id', $drug->id)->where('department_id', $department)
                        ->where('quantity', '>', 0)->whereDate('expiry_date', '>=', now()->toDateString())
                        ->orderBy('expiry_date')->lockForUpdate()->first();
                    if (!$stock || $stock->quantity < $line['quantity']) {
                        throw new OfflineSaleConflictException("Insufficient stock for {$drug->name}. Sale is held for HOD review.");
                    }
                    if (StockCount::where('department_id', $department)->where('status', 'counting')->exists()) {
                        throw new OfflineSaleConflictException('Sales are paused for this pharmacy unit while a physical stock count is in progress.');
                    }
                    $stock->decrement('quantity', $line['quantity']);
                    $sale->items()->create([
                        'drug_id' => $drug->id, 'quantity' => $line['quantity'],
                        'unit_price_naira' => $line['unit_price_naira'], 'cost_price_naira' => $stock->cost_price_naira,
                        'line_total_naira' => $line['quantity'] * $line['unit_price_naira'],
                    ]);
                    if ($prescriptionItem) {
                        $prescriptionItem->increment('dispensed_quantity', $line['quantity']);
                    }
                }
                if ($prescription) {
                    $prescription->refresh()->load('items');
                    $prescription->update(['status' => $prescription->items->every(fn ($item) => $item->dispensed_quantity >= $item->quantity) ? 'dispensed' : 'partially_dispensed']);
                }
                return $sale->load('items');
            });

            SyncConflict::where('client_sale_id', $data['local_id'])->update(['status' => 'resolved']);
            return response()->json(['sale' => $sale, 'is_synced' => true, 'local_id' => $data['local_id']], 201);
        } catch (OfflineSaleConflictException $error) {
            $departmentId = $request->user()->department_id ?? 2;
            SyncConflict::updateOrCreate(['client_sale_id' => $data['local_id']], [
                'invoice_no' => $data['invoice_no'], 'staff_id' => $request->user()->id,
                'department_id' => $departmentId, 'payload' => $data, 'reason' => $error->getMessage(),
                'status' => 'pending', 'review_note' => null, 'reviewed_by' => null, 'reviewed_at' => null,
            ]);
            return response()->json(['message' => $error->getMessage(), 'conflict' => true, 'local_id' => $data['local_id']], 409);
        }
    }

    public function index(Request $request)
    {
        $query = Sale::with(['patient', 'items', 'items.drug', 'department', 'staff', 'prescription']);
        if ($request->user()->role === 'pharmacy_staff') $query->where('staff_id', $request->user()->id);
        if ($request->query('from')) $query->whereDate('sold_at', '>=', $request->query('from'));
        if ($request->query('to')) $query->whereDate('sold_at', '<=', $request->query('to'));
        return $query->latest('sold_at')->paginate(30);
    }
}
