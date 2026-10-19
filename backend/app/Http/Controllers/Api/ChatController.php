<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StaffMessage;
use App\Models\User;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function contacts(Request $request)
    {
        $me = $request->user();
        $contacts = User::query()->where('is_active', true)->whereKeyNot($me->id)->with('department')->orderBy('name')->get();

        return $contacts->map(function (User $contact) use ($me) {
            $conversation = StaffMessage::query()
                ->where(fn ($query) => $query->where('sender_id', $me->id)->where('recipient_id', $contact->id))
                ->orWhere(fn ($query) => $query->where('sender_id', $contact->id)->where('recipient_id', $me->id));
            $lastMessage = (clone $conversation)->latest('id')->first();
            $unreadCount = StaffMessage::query()->where('sender_id', $contact->id)->where('recipient_id', $me->id)->whereNull('read_at')->count();

            return [
                'id' => $contact->id,
                'name' => $contact->name,
                'email' => $contact->email,
                'role' => $contact->role,
                'department' => $contact->department?->name,
                'last_message' => $lastMessage?->body,
                'last_message_at' => $lastMessage?->created_at,
                'unread_count' => $unreadCount,
            ];
        });
    }

    public function messages(Request $request, User $user)
    {
        $me = $request->user();
        abort_if($user->id === $me->id || !$user->is_active, 404);

        StaffMessage::query()->where('sender_id', $user->id)->where('recipient_id', $me->id)->whereNull('read_at')->update(['read_at' => now()]);

        return StaffMessage::query()
            ->where(fn ($query) => $query->where('sender_id', $me->id)->where('recipient_id', $user->id))
            ->orWhere(fn ($query) => $query->where('sender_id', $user->id)->where('recipient_id', $me->id))
            ->with(['sender:id,name', 'recipient:id,name'])
            ->latest('id')->limit(100)->get()->reverse()->values();
    }

    public function send(Request $request, User $user)
    {
        abort_if($user->id === $request->user()->id || !$user->is_active, 404);
        $data = $request->validate(['body' => 'required|string|max:4000']);
        abort_if(trim($data['body']) === '', 422, 'Write a message before sending.');
        $message = StaffMessage::create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $user->id,
            'body' => trim($data['body']),
        ]);

        return response()->json($message->load(['sender:id,name', 'recipient:id,name']), 201);
    }
}
