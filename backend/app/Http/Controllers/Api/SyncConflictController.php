<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SyncConflict;
use Illuminate\Http\Request;

class SyncConflictController extends Controller
{
    public function index()
    {
        return SyncConflict::with(['staff:id,name', 'department:id,name', 'reviewer:id,name'])
            ->latest()->paginate(30);
    }

    public function review(Request $request, SyncConflict $syncConflict)
    {
        $data = $request->validate(['review_note' => 'required|string|max:2000']);
        $syncConflict->update([
            'status' => 'reviewed',
            'review_note' => $data['review_note'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return $syncConflict->fresh()->load(['staff:id,name', 'department:id,name', 'reviewer:id,name']);
    }
}
