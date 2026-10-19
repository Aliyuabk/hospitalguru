<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockCountItem extends Model
{
    protected $fillable = ['stock_count_id', 'stock_id', 'drug_id', 'batch_no', 'expected_quantity', 'counted_quantity', 'counted_by', 'counted_at'];

    protected function casts(): array
    {
        return ['expected_quantity' => 'integer', 'counted_quantity' => 'integer', 'counted_at' => 'datetime'];
    }

    public function stockCount() { return $this->belongsTo(StockCount::class); }
    public function stock() { return $this->belongsTo(Stock::class); }
    public function drug() { return $this->belongsTo(Drug::class); }
    public function counter() { return $this->belongsTo(User::class, 'counted_by'); }
}
