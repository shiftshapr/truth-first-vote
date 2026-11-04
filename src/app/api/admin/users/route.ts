import { NextResponse } from 'next/server';
import { envAdminEmails, listDbAdminEmails, requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { isEmail } from '@/lib/site';

export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ fromEnv: envAdminEmails(), added: await listDbAdminEmails() });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const email = String((await request.json().catch(() => ({}))).email || '').trim().toLowerCase();
  if (!isEmail(email)) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
  const pool = await db();
  await pool.query(
    'INSERT INTO tf_admin_user (email, added_by) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
    [email, auth.email],
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const email = String(new URL(request.url).searchParams.get('email') || '').trim().toLowerCase();
  if (email === auth.email) return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 });
  const pool = await db();
  await pool.query('DELETE FROM tf_admin_user WHERE email = $1', [email]);
  return NextResponse.json({ ok: true });
}
