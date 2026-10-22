import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSessionUser, hashPassword, hashToken, SESSION_COOKIE, verifyPassword } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in again before changing your password.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const currentPassword = String(body?.current_password || '');
  const newPassword = String(body?.new_password || '');
  if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Enter your current and new passwords.' }, { status: 422 });
  if (newPassword.length < 10 || newPassword.length > 256) return NextResponse.json({ error: 'Your new password must be between 10 and 256 characters.' }, { status: 422 });
  if (currentPassword === newPassword) return NextResponse.json({ error: 'Choose a new password that differs from your current password.' }, { status: 422 });

  const [rows] = await db.execute('SELECT password_hash FROM users WHERE id=? AND status=\'active\' LIMIT 1', [user.id]);
  const account = (rows as Array<{ password_hash: string }>)[0];
  if (!account || !verifyPassword(currentPassword, account.password_hash)) {
    return NextResponse.json({ error: 'Your current password is incorrect.' }, { status: 401 });
  }

  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Your session expired. Sign in again.' }, { status: 401 });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE users SET password_hash=?,password_changed_at=UTC_TIMESTAMP(),updated_at=UTC_TIMESTAMP() WHERE id=?', [hashPassword(newPassword), user.id]);
    await conn.execute('DELETE FROM access_tokens WHERE user_id=? AND token_hash<>?', [user.id, hashToken(token)]);
    await conn.execute('INSERT INTO audit_logs(actor_user_id,actor_role,action,module,entity_type,entity_id,outcome) VALUES(?,?,?,?,?,?,?)', [user.id, user.role_key, 'changed_password', 'authentication', 'user', String(user.id), 'success']);
    await conn.commit();
    return NextResponse.json({ ok: true, sessions_revoked: true });
  } catch (error) {
    await conn.rollback();
    console.error('Password change failed:', error);
    return NextResponse.json({ error: 'Unable to update your password.' }, { status: 503 });
  } finally {
    conn.release();
  }
}
