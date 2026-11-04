import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { deleteSiteMessage, updateSiteMessage } from '@/lib/site-messages';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  try {
    const message = await updateSiteMessage(id, await request.json(), auth.email);
    return message ? NextResponse.json({ ok: true, message }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid message' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  return (await deleteSiteMessage(id))
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
