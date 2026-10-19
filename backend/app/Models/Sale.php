<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Sale extends Model { protected $fillable=['invoice_no','patient_id','prescription_id','staff_id','department_id','subtotal_naira','discount_naira','total_naira','payment_mode','is_synced','client_sale_id','sold_at']; protected function casts():array{return ['is_synced'=>'boolean','sold_at'=>'datetime'];} public function items(){return $this->hasMany(SaleItem::class);} public function patient(){return $this->belongsTo(Patient::class);} public function prescription(){return $this->belongsTo(Prescription::class);} public function staff(){return $this->belongsTo(User::class,'staff_id');} public function department(){return $this->belongsTo(Department::class);} }
