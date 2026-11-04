import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasSessionCookie } from '@/lib/auth-session-cookie';

/**
 * Cheap edge gate: admin APIs need a session cookie at all. Each route still
 * checks the session and the admin allowlist itself (lib/admin-auth.ts).
 */
const PROTECTED_API_PREFIXES = ['/api/admin'];

/** Web3Auth's allowed origin is the apex domain, so www redirects to it. */
function apexRedirect(request: NextRequest) {
  const host = (request.headers.get('host') || '').split(':')[0];
  if (host !== 'www.truthfirst.vote') return null;
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(`${proto}://truthfirst.vote${path}`, 301);
}

export function middleware(request: NextRequest) {
  const apex = apexRedirect(request);
  if (apex) return apex;

  const { pathname } = request.nextUrl;
  const protectedApi = PROTECTED_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (protectedApi && !hasSessionCookie(request.cookies)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
