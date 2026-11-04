import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { replyToTicket } from '@/lib/support';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  const result = await replyToTicket((await params).id, String(body.body || ''), auth.email);
  return result.ok ? NextResponse.json(result) : NextResponse.json({ error: result.error }, { status: 400 });
}
