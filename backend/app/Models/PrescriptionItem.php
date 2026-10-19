<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrescriptionItem extends Model
{
    protected $fillable = ['prescription_id', 'drug_id', 'quantity', 'dispensed_quantity', 'dosage', 'duration', 'instructions'];
    protected function casts(): array { return ['quantity' => 'integer', 'dispensed_quantity' => 'integer']; }
    public function drug() { return $this->belongsTo(Drug::class); }
    public function prescription() { return $this->belongsTo(Prescription::class); }
}
