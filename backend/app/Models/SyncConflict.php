<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncConflict extends Model
{
    protected $fillable = ['client_sale_id', 'invoice_no', 'staff_id', 'department_id', 'payload', 'reason', 'status', 'reviewed_by', 'review_note', 'reviewed_at'];

    protected function casts(): array { return ['payload' => 'array', 'reviewed_at' => 'datetime']; }
    public function staff() { return $this->belongsTo(User::class, 'staff_id'); }
    public function department() { return $this->belongsTo(Department::class); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
}
