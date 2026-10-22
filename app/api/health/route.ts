import { NextResponse } from 'next/server';
import { databaseConfigurationError, db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configurationError = databaseConfigurationError();
  if (configurationError) {
    return NextResponse.json({ status: 'not_ready', database: 'not_configured' }, { status: 503 });
  }

  try {
    await db.query('SELECT 1');
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch {
    // Keep connection details and credentials out of a public health response.
    return NextResponse.json({ status: 'not_ready', database: 'unavailable' }, { status: 503 });
  }
}
