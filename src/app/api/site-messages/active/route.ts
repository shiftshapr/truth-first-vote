import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth-session';
import { getPlayer } from '@/lib/players';
import { activeSiteMessages } from '@/lib/site-messages';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await readSession();
    const registered = session ? Boolean(await getPlayer(session.userId).catch(() => null)) : false;
    const messages = await activeSiteMessages({ signedIn: Boolean(session), registered });
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
