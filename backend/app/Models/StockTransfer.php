<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class StockTransfer extends Model { protected $fillable=['transfer_no','from_department_id','to_department_id','drug_id','from_stock_id','batch_no','quantity','created_by','status','transferred_at']; protected function casts():array{return ['transferred_at'=>'datetime'];} public function drug(){return $this->belongsTo(Drug::class);} public function fromDepartment(){return $this->belongsTo(Department::class,'from_department_id');} public function toDepartment(){return $this->belongsTo(Department::class,'to_department_id');} public function creator(){return $this->belongsTo(User::class,'created_by');} }
