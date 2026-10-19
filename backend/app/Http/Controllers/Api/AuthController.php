<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
class AuthController extends Controller {
 public function login(Request $r){$data=$r->validate(['email'=>'required|email','password'=>'required|string']);$user=User::where('email',$data['email'])->where('is_active',true)->first();if(!$user||!Hash::check($data['password'],$user->password))return response()->json(['message'=>'Invalid credentials'],422);return response()->json(['token'=>$user->createToken('pharmacy')->plainTextToken,'user'=>$user]);}
 public function logout(Request $r){$r->user()->currentAccessToken()->delete();return response()->json(['message'=>'Logged out']);}
 public function me(Request $r){return response()->json($r->user()->load('department'));}
}
