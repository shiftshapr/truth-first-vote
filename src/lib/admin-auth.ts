import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readSessionFromCookies, type CookieGetter } from '@/lib/auth-session';
import { db } from '@/lib/db';

/** Bootstrap admins from env; more can be added in the admin console (tf_admin_user). */
export function envAdminEmails(): string[] {
  return String(process.env.TF_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function listDbAdminEmails(): Promise<string[]> {
  try {
    const pool = await db();
    const res = await pool.query('SELECT email FROM tf_admin_user ORDER BY added_at ASC');
    return res.rows.map((r) => String(r.email).toLowerCase());
  } catch {
    return [];
  }
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return false;
  if (envAdminEmails().includes(normalized)) return true;
  return (await listDbAdminEmails()).includes(normalized);
}

export async function resolveAdminEmail(store: CookieGetter): Promise<string | null> {
  const session = await readSessionFromCookies(store);
  const email = session?.email?.trim().toLowerCase();
  if (!email) return null;
  return (await isAdminEmail(email)) ? email : null;
}

/** For admin API routes: the admin's email, or a 401/403 response to return. */
export async function requireAdmin(): Promise<{ email: string } | { response: NextResponse }> {
  const store = await cookies();
  const session = await readSessionFromCookies(store);
  if (!session) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const email = session.email?.trim().toLowerCase() || '';
  if (!(await isAdminEmail(email))) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { email };
}
