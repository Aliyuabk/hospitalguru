<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockCount extends Model
{
    protected $fillable = ['reference', 'department_id', 'status', 'started_by', 'completed_by', 'started_at', 'completed_at'];

    protected function casts(): array
    {
        return ['started_at' => 'datetime', 'completed_at' => 'datetime'];
    }

    public function department() { return $this->belongsTo(Department::class); }
    public function starter() { return $this->belongsTo(User::class, 'started_by'); }
    public function completer() { return $this->belongsTo(User::class, 'completed_by'); }
    public function items() { return $this->hasMany(StockCountItem::class); }
}
