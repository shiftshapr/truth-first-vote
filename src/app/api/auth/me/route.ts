import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin-auth';
import { refreshSessionFromCanopi } from '@/lib/auth-profile';
import { readSession, setSessionCookies } from '@/lib/auth-session';
import { getPlayer } from '@/lib/players';

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ authenticated: false });

  let profileImage = session.profileImage ?? null;
  let canopiUserId = session.canopiUserId ?? null;
  let sessionChanged = false;

  const refreshed = await refreshSessionFromCanopi(session);
  if (refreshed) {
    profileImage = refreshed.profileImage;
    canopiUserId = refreshed.canopiUserId;
    sessionChanged = refreshed.changed;
  }

  const [registered, admin] = await Promise.all([
    getPlayer(session.userId).then(Boolean).catch(() => false),
    isAdminEmail(session.email),
  ]);

  const response = NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      username: session.username,
      displayName: session.displayName,
      profileImage,
      verifierId: session.verifierId,
    },
    registered,
    admin,
  });

  if (sessionChanged) {
    await setSessionCookies(response.cookies, { ...session, profileImage, canopiUserId }, await cookies());
  }
  return response;
}
