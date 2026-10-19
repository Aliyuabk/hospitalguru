<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class AccountController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'current_password' => 'sometimes|nullable|string',
            'password' => ['sometimes', 'nullable', 'confirmed', Password::min(8)],
            'profile_photo' => 'sometimes|nullable|image|max:2048',
        ]);

        $emailChanged = isset($data['email']) && $data['email'] !== $user->email;
        $passwordChanged = !empty($data['password']);
        if ($emailChanged || $passwordChanged) {
            abort_unless(!empty($data['current_password']) && Hash::check($data['current_password'], $user->password), 422, 'Enter your current password to change your email or password.');
        } elseif (!empty($data['current_password'])) {
            abort_unless(Hash::check($data['current_password'], $user->password), 422, 'The current password is incorrect.');
        }

        unset($data['current_password']);
        unset($data['profile_photo']);
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if ($request->hasFile('profile_photo')) {
            $oldPath = $user->profile_photo_path;
            $data['profile_photo_path'] = $request->file('profile_photo')->store('profiles', 'public');
            if ($oldPath) Storage::disk('public')->delete($oldPath);
        }

        $user->update($data);
        return response()->json($user->fresh()->load('department'));
    }
}
