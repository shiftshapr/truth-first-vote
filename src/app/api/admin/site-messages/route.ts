import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createSiteMessage, listSiteMessages } from '@/lib/site-messages';

export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ messages: await listSiteMessages() });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  try {
    const message = await createSiteMessage(await request.json(), auth.email);
    return NextResponse.json({ ok: true, message });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid message' }, { status: 400 });
  }
}
