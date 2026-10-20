import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { RowDataPacket } from 'mysql2/promise';
import type { NextRequest } from 'next/server';
import { one, run } from './mysql';

export type User = RowDataPacket & { id: number; name: string; email: string; role: string; department_id: number | null; is_active: number; phone?: string | null; designation?: string | null; employee_id?: string | null; address?: string | null; emergency_contact_name?: string | null; emergency_contact_phone?: string | null; professional_license_no?: string | null; profile_photo_path?: string | null; profile_photo_url?: string | null };
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

export async function login(email: string, password: string) {
  const user = await one<User & { password: string }>("SELECT id,name,email,role,department_id,is_active,phone,designation,employee_id,address,emergency_contact_name,emergency_contact_phone,professional_license_no,profile_photo_path,CASE WHEN profile_photo_path IS NULL OR profile_photo_path='' THEN NULL ELSE CONCAT('/',profile_photo_path) END profile_photo_url,password FROM users WHERE email=? LIMIT 1", [email]);
  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password))) return null;
  const token = randomBytes(32).toString('hex');
  await run('INSERT INTO personal_access_tokens (tokenable_type,tokenable_id,name,token,abilities,created_at,updated_at) VALUES (?,?,?,?,?,?,?)', ['App\\Models\\User', user.id, 'pharmacy', tokenHash(token), '["*"]', new Date(), new Date()]);
  const { password: _password, ...safeUser } = user;
  return { token, user: safeUser };
}

export async function currentUser(request: NextRequest): Promise<User | null> {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return null;
  return one<User>(`SELECT u.id,u.name,u.email,u.role,u.department_id,u.is_active,u.phone,u.designation,u.employee_id,u.address,u.emergency_contact_name,u.emergency_contact_phone,u.professional_license_no,u.profile_photo_path,
    CASE WHEN u.profile_photo_path IS NULL OR u.profile_photo_path='' THEN NULL ELSE CONCAT('/',u.profile_photo_path) END profile_photo_url
    FROM personal_access_tokens t JOIN users u ON u.id=t.tokenable_id
    WHERE t.tokenable_type='App\\\\Models\\\\User' AND t.token=? AND (t.expires_at IS NULL OR t.expires_at>NOW()) AND u.is_active=1 LIMIT 1`, [tokenHash(bearer)]);
}

export async function logout(request: NextRequest) {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) await run('DELETE FROM personal_access_tokens WHERE token=?', [tokenHash(bearer)]);
}

export function allowed(user: User, roles: string[]) { return roles.includes(user.role); }
