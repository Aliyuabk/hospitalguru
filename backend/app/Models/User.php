<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
class User extends Authenticatable { use HasApiTokens, HasFactory; protected $fillable=['name','email','password','role','department_id','is_active','profile_photo_path']; protected $hidden=['password','remember_token']; protected $appends=['profile_photo_url']; protected function casts():array{return ['password'=>'hashed','is_active'=>'boolean'];} public function getProfilePhotoUrlAttribute():?string{return $this->profile_photo_path?\Illuminate\Support\Facades\Storage::disk('public')->url($this->profile_photo_path):null;} public function department(){return $this->belongsTo(Department::class);} public function sales(){return $this->hasMany(Sale::class,'staff_id');} }
