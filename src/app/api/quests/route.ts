import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth-session';
import { getPlayer } from '@/lib/players';
import { submitQuest } from '@/lib/quests';

/** Hand in a reviewed quest: { questId, url?, body? }. */
export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    if (!(await getPlayer(session.userId))) return NextResponse.json({ error: 'Join the game first.' }, { status: 400 });
    const submission = await submitQuest(session.userId, String(body.questId || ''), body);
    return NextResponse.json({ ok: true, submission });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    if (status >= 500) console.error('[quests]', err);
    return NextResponse.json({ error: status >= 500 ? 'Could not save that. Try again in a moment.' : (err as Error).message }, { status });
  }
}
