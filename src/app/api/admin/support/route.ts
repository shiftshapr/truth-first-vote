import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { listTickets, type TicketStatus } from '@/lib/support';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const status = new URL(request.url).searchParams.get('status') as TicketStatus | null;
  return NextResponse.json({ tickets: await listTickets(status || undefined) });
}
