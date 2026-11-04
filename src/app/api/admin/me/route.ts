import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { databaseUrl } from '@/lib/db';
import { emailConfigured } from '@/lib/email';

export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  return NextResponse.json({
    ok: true,
    email: auth.email,
    database: Boolean(databaseUrl()),
    email_sending: emailConfigured(),
  });
}
