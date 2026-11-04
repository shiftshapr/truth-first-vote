import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { listSubmissions, reviewSubmission } from '@/lib/quests';

/** Quest submissions, by status (default: pending). */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const status = new URL(request.url).searchParams.get('status') || 'pending';
  return NextResponse.json({ submissions: await listSubmissions(status === 'all' ? null : status) });
}

/** Review one: { id, approve: boolean, note? }. Approving awards the quest's points. */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  try {
    const submission = await reviewSubmission(String(body.id || ''), body.approve === true, String(body.note || ''), auth.email);
    return NextResponse.json({ ok: true, submission });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    if (status >= 500) console.error('[admin/quests]', err);
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
