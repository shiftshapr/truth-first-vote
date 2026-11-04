import { NextResponse } from 'next/server';
import { unsubscribeByToken } from '@/lib/players';

/** RFC 8058 one-click (mail clients) and the confirm button on /unsubscribe both POST here. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let token = url.searchParams.get('token') || '';
  if (!token) {
    const body = await request.json().catch(() => ({}));
    token = String(body.token || '');
  }
  try {
    const ok = await unsubscribeByToken(token);
    if (!ok) return NextResponse.json({ error: 'That unsubscribe link is not valid.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not unsubscribe right now.' }, { status: 500 });
  }
}
