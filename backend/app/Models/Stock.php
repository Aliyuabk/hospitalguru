<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Stock extends Model { protected $fillable=['drug_id','department_id','batch_no','quantity','cost_price_naira','selling_price_naira','expiry_date','supplier_id']; protected function casts():array{return ['expiry_date'=>'date','cost_price_naira'=>'integer','selling_price_naira'=>'integer'];} public function drug(){return $this->belongsTo(Drug::class);} public function department(){return $this->belongsTo(Department::class);} public function supplier(){return $this->belongsTo(Supplier::class);} }
