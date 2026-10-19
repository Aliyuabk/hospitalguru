<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    protected $fillable = ['prescription_no', 'patient_id', 'doctor_id', 'status', 'notes', 'prescribed_at'];
    protected function casts(): array { return ['prescribed_at' => 'datetime']; }
    public function patient() { return $this->belongsTo(Patient::class); }
    public function doctor() { return $this->belongsTo(User::class, 'doctor_id'); }
    public function items() { return $this->hasMany(PrescriptionItem::class); }
    public function sales() { return $this->hasMany(Sale::class); }
}
