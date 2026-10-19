<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PrescriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = Prescription::with(['patient:id,folder_no,full_name,phone', 'doctor:id,name', 'items.drug:id,name,sku'])
            ->latest('prescribed_at');
        if ($request->user()->role === 'doctor') $query->where('doctor_id', $request->user()->id);
        if ($request->user()->role === 'pharmacy_staff') $query->whereIn('status', ['pending', 'partially_dispensed']);
        return $query->paginate(30);
    }

    public function store(Request $request)
    {
        abort_unless(in_array($request->user()->role, ['doctor', 'hod'], true), 403);
        $data = $request->validate([
            'patient_id' => 'required|exists:patients,id', 'notes' => 'nullable|string|max:4000',
            'items' => 'required|array|min:1', 'items.*.drug_id' => 'required|exists:drugs,id',
            'items.*.quantity' => 'required|integer|min:1', 'items.*.dosage' => 'nullable|string|max:255',
            'items.*.duration' => 'nullable|string|max:255', 'items.*.instructions' => 'nullable|string|max:1000',
        ]);
        $prescription = DB::transaction(function () use ($data, $request) {
            $prescription = Prescription::create([
                'prescription_no' => 'RX-' . now()->format('Ymd') . '-' . strtoupper(substr(str_replace('-', '', (string) \Illuminate\Support\Str::uuid()), 0, 8)),
                'patient_id' => $data['patient_id'], 'doctor_id' => $request->user()->id,
                'status' => 'pending', 'notes' => $data['notes'] ?? null, 'prescribed_at' => now(),
            ]);
            $prescription->items()->createMany($data['items']);
            return $prescription;
        });
        return response()->json($prescription->load(['patient', 'doctor:id,name', 'items.drug']), 201);
    }

    public function show(Request $request, Prescription $prescription)
    {
        abort_if($request->user()->role === 'doctor' && $prescription->doctor_id !== $request->user()->id, 403);
        if ($request->user()->role === 'pharmacy_staff') {
            abort_unless(in_array($prescription->status, ['pending', 'partially_dispensed'], true), 403, 'This prescription is no longer available for dispensing.');
        }
        return $prescription->load(['patient', 'doctor:id,name', 'items.drug:id,name,sku,unit']);
    }
}
