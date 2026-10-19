<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return User::with('department')->orderBy('name')->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255', 'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8', 'role' => 'required|in:hod,store_keeper,pharmacy_staff,md,doctor',
            'department_id' => 'nullable|exists:departments,id', 'is_active' => 'sometimes|boolean',
        ]);
        $data['password'] = Hash::make($data['password']);
        return User::create($data)->load('department');
    }

    public function show(User $user)
    {
        return $user->load('department');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255', 'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8', 'role' => 'sometimes|required|in:hod,store_keeper,pharmacy_staff,md,doctor',
            'department_id' => 'nullable|exists:departments,id', 'is_active' => 'sometimes|boolean',
        ]);
        $this->protectLastSuperAdmin($user, $data);
        abort_if($user->id === $request->user()->id && isset($data['role']) && $data['role'] !== $request->user()->role, 422, 'You cannot change your own role.');
        if (isset($data['password'])) $data['password'] = Hash::make($data['password']);
        else unset($data['password']);
        abort_if($user->id === $request->user()->id && ($data['is_active'] ?? true) === false, 422, 'You cannot deactivate your own account.');
        $user->update($data);
        if (array_key_exists('is_active', $data) && !$data['is_active']) $user->tokens()->delete();
        return $user->load('department');
    }

    public function destroy(Request $request, User $user)
    {
        abort_if($user->id === $request->user()->id, 422, 'You cannot remove your own account.');
        $this->protectLastSuperAdmin($user, ['is_active' => false]);
        $user->update(['is_active' => false]);
        $user->tokens()->delete();
        return response()->noContent();
    }

    private function protectLastSuperAdmin(User $user, array $changes): void
    {
        $roleChangesAwayFromAdmin = isset($changes['role']) && $changes['role'] !== 'hod';
        $deactivatingAdmin = ($changes['is_active'] ?? true) === false;
        if ($user->role === 'hod' && $user->is_active && ($roleChangesAwayFromAdmin || $deactivatingAdmin)) {
            abort_if(User::where('role', 'hod')->where('is_active', true)->count() <= 1, 422, 'At least one active HOD Super Admin account must remain.');
        }
    }
}
