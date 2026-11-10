import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth-session';
import { DatabaseNotConfiguredError } from '@/lib/db';
import { deletePlayer, getPlayer, upsertPlayer } from '@/lib/players';

function fail(err: unknown) {
  const status = (err as { status?: number }).status;
  if (status && status < 500) return NextResponse.json({ error: (err as Error).message }, { status });
  console.error('[player]', err);
  return NextResponse.json(
    { error: 'Player profiles are unavailable right now.' },
    { status: err instanceof DatabaseNotConfiguredError ? 503 : 500 },
  );
}

/** The signed-in person's player profile, or null if they haven't joined yet. */
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  try {
    return NextResponse.json({ player: await getPlayer(session.userId), email: session.email ?? null });
  } catch (err) {
    return fail(err);
  }
}

/** Join the game (first save) or update the profile. */
export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (!body.agree) return NextResponse.json({ error: 'Please tick the box to agree before you join.' }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await upsertPlayer(session, body)) });
  } catch (err) {
    return fail(err);
  }
}

/** Leave the game: deletes the profile, quest submissions and points. */
export async function DELETE() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  try {
    await deletePlayer(session.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
