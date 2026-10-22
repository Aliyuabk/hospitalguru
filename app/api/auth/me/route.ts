import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
export const runtime = 'nodejs';
export async function GET() {
  try { const user = await getSessionUser(); return user ? NextResponse.json({ user }) : NextResponse.json({ error:'Unauthenticated' },{status:401}); }
  catch { return NextResponse.json({ error:'Database unavailable' },{status:503}); }
}
