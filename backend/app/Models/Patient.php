<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Patient extends Model { protected $fillable=['folder_no','full_name','phone','nhis_number']; public function sales(){return $this->hasMany(Sale::class);} }
