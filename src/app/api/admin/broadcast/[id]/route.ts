import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { setBroadcastArchive } from '@/lib/broadcasts';

/** Toggle whether a sent broadcast appears on the public /updates page. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const ok = await setBroadcastArchive(id, Boolean(body.publicArchive));
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
