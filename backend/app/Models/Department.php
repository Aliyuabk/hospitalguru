<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Department extends Model { protected $fillable=['name','code','type','is_active']; public function stocks(){return $this->hasMany(Stock::class);} public function sales(){return $this->hasMany(Sale::class);} }
