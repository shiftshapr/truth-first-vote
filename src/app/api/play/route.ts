import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth-session';
import { getPlayer, leaderboard, pointsHistory } from '@/lib/players';
import { mySubmissions } from '@/lib/quests';
import { publicBase } from '@/lib/site';

export const dynamic = 'force-dynamic';

/** Everything the game page needs for the signed-in player. */
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  try {
    const player = await getPlayer(session.userId);
    if (!player) return NextResponse.json({ player: null });
    const [history, submissions, leaders] = await Promise.all([
      pointsHistory(session.userId),
      mySubmissions(session.userId),
      leaderboard(20, session.userId),
    ]);
    return NextResponse.json({
      player,
      history,
      submissions,
      leaders,
      inviteUrl: `${publicBase()}/play?invite=${encodeURIComponent(player.inviteCode)}`,
    });
  } catch (err) {
    console.error('[play]', err);
    return NextResponse.json({ error: 'The game is unavailable right now.' }, { status: 500 });
  }
}
