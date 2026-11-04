import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getTicket, setTicketStatus, type TicketStatus } from '@/lib/support';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const ticket = await getTicket((await params).id);
  return ticket ? NextResponse.json({ ticket }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  const ok = await setTicketStatus((await params).id, String(body.status) as TicketStatus);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not updated' }, { status: 400 });
}
