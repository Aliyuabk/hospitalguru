import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, hashPassword } from '@/lib/auth';
export const runtime = 'nodejs';

export async function GET() {
  try { const [rows] = await db.query('SELECT COUNT(*) AS count FROM users'); return NextResponse.json({ setup_required:Number((rows as any[])[0].count)===0 }); }
  catch { return NextResponse.json({ error:'Database unavailable' },{status:503}); }
}

export async function POST(request: Request) {
  const body = await request.json();
  const name=String(body.name||'').trim(), username=String(body.username||'').trim(), email=String(body.email||'').trim()||null, password=String(body.password||'');
  if(!name||!username||password.length<10) return NextResponse.json({error:'Enter a name, username, and password of at least 10 characters.'},{status:422});
  const conn=await db.getConnection();
  try {
    await conn.beginTransaction();
    const [roleRows] = await conn.execute("SELECT id FROM roles WHERE role_key='super_administrator' AND is_active=1 FOR UPDATE");
    if(!(roleRows as any[]).length) throw new Error('Super Administrator role is missing. Import database/schema.sql first.');
    const [countRows] = await conn.query('SELECT COUNT(*) AS count FROM users');
    if(Number((countRows as any[])[0].count)>0) throw new Error('Initial setup is already complete.');
    const [result] = await conn.execute("INSERT INTO users(name,username,email,password_hash,role_id,status) VALUES(?,?,?,?,?,'active')",[name,username,email,hashPassword(password),(roleRows as any[])[0].id]);
    const userId=(result as any).insertId;
    await conn.commit(); await createSession(userId);
    return NextResponse.json({ok:true,redirect:'/super-admin/dashboard'}, {status:201});
  } catch(error) { await conn.rollback(); return NextResponse.json({error:error instanceof Error?error.message:'Initial setup failed.'},{status:409}); }
  finally { conn.release(); }
}
