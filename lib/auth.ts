import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';

export const SESSION_COOKIE = 'bkd_session';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hex] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !salt || !hex) return false;
  const expected = Buffer.from(hex, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export type SessionUser = { id: number; name: string; username: string; email: string | null; role_key: string; role_name: string; location_id: number | null; location_name: string | null; location_ids?: string; location_names?: string };

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [rows] = await db.execute(
    `SELECT u.id,u.name,u.username,u.email,r.role_key,r.name role_name,u.primary_location_id location_id,l.name location_name,
       COALESCE((SELECT GROUP_CONCAT(ul.location_id ORDER BY ul.is_default DESC,ul.location_id) FROM user_locations ul WHERE ul.user_id=u.id),CAST(u.primary_location_id AS CHAR),'') location_ids,
       COALESCE((SELECT GROUP_CONCAT(loc.name ORDER BY ul.is_default DESC,loc.name SEPARATOR ', ') FROM user_locations ul JOIN locations loc ON loc.id=ul.location_id WHERE ul.user_id=u.id),l.name,'') location_names
     FROM access_tokens t JOIN users u ON u.id=t.user_id JOIN roles r ON r.id=u.role_id
     LEFT JOIN locations l ON l.id=u.primary_location_id
     WHERE t.token_hash=? AND (t.expires_at IS NULL OR t.expires_at>UTC_TIMESTAMP()) AND u.status='active' AND r.is_active=1 LIMIT 1`,
    [hashToken(token)],
  );
  const list = rows as SessionUser[];
  return list[0] ?? null;
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString('base64url');
  const [settings]=await db.execute('SELECT setting_value FROM application_settings WHERE setting_key=?',['session_timeout']);
  const hours=Math.max(1,Math.min(720,Number((settings as any[])[0]?.setting_value)||12));
  await db.execute('INSERT INTO access_tokens(user_id,token_hash,label,expires_at) VALUES(?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? HOUR))', [userId, hashToken(token), 'web session',hours]);
  cookies().set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * hours });
}

export async function destroySession() {
  const jar = cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.execute('DELETE FROM access_tokens WHERE token_hash=?', [hashToken(token)]);
  jar.delete(SESSION_COOKIE);
}
