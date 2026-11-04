'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { avatarInitials, resolveAvatarUrl } from '@/lib/avatar';
import { SITE } from '@/lib/site';

export function BrandMark() {
  return (
    <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true" style={{ flex: 'none' }}>
      <rect width="64" height="64" rx="14" fill="#14213d" />
      <path d="M18 34l9 9 19-22" stroke="#e9b44c" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SiteHeader() {
  const { user, checked, login, loginBusy, logout } = useAuth();
  const avatar = user ? resolveAvatarUrl(user.profileImage, 64) : null;

  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand">
          <BrandMark />
          {SITE.short}
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/countries" className="hide-sm">Countries</Link>
          <Link href="/updates" className="hide-sm">Updates</Link>
          <Link href="/support" className="hide-sm">Support</Link>
          {checked && user ? (
            <>
              <Link href="/play">Play</Link>
              <button type="button" className="cs-btn cs-btn--secondary cs-btn--small" onClick={() => void logout()}>
                Sign out
              </button>
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="avatar" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar" aria-hidden="true">{avatarInitials(user.displayName, user.username)}</span>
              )}
            </>
          ) : (
            <button
              type="button"
              className="cs-btn cs-btn--small"
              disabled={loginBusy}
              onClick={() => void login().catch(() => {})}
            >
              {loginBusy ? 'Signing in…' : 'Sign in to play'}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
