<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Drug extends Model { protected $fillable=['name','barcode','sku','category','unit','is_active']; public function stocks(){return $this->hasMany(Stock::class);} }
