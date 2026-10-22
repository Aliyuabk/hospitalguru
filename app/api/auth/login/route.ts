import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.username || body.email || '').trim();
    const password = String(body.password || '');
    if (!identifier || !password) return NextResponse.json({ error: 'Enter your username and password.' }, { status: 422 });
    const [rows] = await db.execute(
      `SELECT u.id,u.name,u.password_hash,u.status,r.role_key FROM users u JOIN roles r ON r.id=u.role_id
       WHERE (u.username=? OR u.email=?) AND r.is_active=1 LIMIT 1`, [identifier, identifier],
    );
    const user = (rows as Array<{id:number;name:string;password_hash:string;status:string;role_key:string}>)[0];
    if (!user || user.status !== 'active' || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'The username or password is incorrect.' }, { status: 401 });
    }
    await db.execute('UPDATE users SET last_login_at=UTC_TIMESTAMP() WHERE id=?', [user.id]);
    await createSession(user.id);
    const routes: Record<string,string> = {
      super_administrator:'/super-admin/dashboard', cmd_executive:'/cmd/dashboard', head_pharmacist:'/head-pharmacist/dashboard',
      drf_store_keeper:'/drf-store/dashboard', pharmacy_dispenser:'/pharmacy/dashboard', pharmacy_supervisor:'/pharmacy-supervisor/dashboard',
      cashier:'/cashier/dashboard', procurement_officer:'/procurement/dashboard', internal_auditor:'/auditor/dashboard', system_administrator:'/system-admin/dashboard',
    };
    return NextResponse.json({ user: { id:user.id,name:user.name,role:user.role_key }, redirect: routes[user.role_key] || '/403' });
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Unable to connect to the hospital database. Confirm XAMPP MySQL is running and the hospitalguru schema is installed.' }, { status: 503 });
  }
}
