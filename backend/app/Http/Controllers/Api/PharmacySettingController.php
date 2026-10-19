<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PharmacySetting;
use Illuminate\Http\Request;

class PharmacySettingController extends Controller
{
    public function show()
    {
        return response()->json([
            'low_stock_threshold' => PharmacySetting::valueFor('low_stock_threshold', 20),
            'expiry_warning_days' => PharmacySetting::valueFor('expiry_warning_days', 30),
        ]);
    }

    public function update(Request $request)
    {
        $values = $request->validate([
            'low_stock_threshold' => 'required|integer|min:1|max:100000',
            'expiry_warning_days' => 'required|integer|min:1|max:3650',
        ]);

        foreach ($values as $key => $value) {
            PharmacySetting::updateOrCreate(['key' => $key], [
                'value' => (string) $value,
                'updated_by' => $request->user()->id,
            ]);
        }

        return $this->show();
    }
}
