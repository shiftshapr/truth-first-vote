'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

/** Same-origin path only: browsers turn "/\\host" and "/<tab>/host" into "//host", so resolve and compare. */
function safeReturnPath(raw: string | null) {
  const path = (raw || '').trim();
  if (!path.startsWith('/') || path.startsWith('//') || /[\\\x00-\x1f]/.test(path)) return '/';
  if (typeof window === 'undefined') return path;
  try {
    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

export default function LoginClient() {
  const router = useRouter();
  const next = safeReturnPath(useSearchParams().get('next'));
  const { user, checked, login, loginBusy, loginError } = useAuth();

  useEffect(() => {
    if (checked && user) router.replace(next);
  }, [checked, user, next, router]);

  return (
    <section className="section">
      <div className="wrap narrow stack-6" style={{ maxWidth: 480 }}>
        <div className="stack-4">
          <p className="meta muted">Sign in</p>
          <h1 className="headline">One account across the Meta-Layer estate</h1>
          <p className="muted">
            Use the same Google or email sign-in as Desirable Properties, Gov Hub and Canopi.
          </p>
        </div>
        {loginError ? <p className="notice notice--error small" role="alert">{loginError}</p> : null}
        <button type="button" className="cs-btn" disabled={loginBusy} onClick={() => void login().catch(() => {})}>
          {loginBusy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="small"><Link href={next}>Back</Link></p>
      </div>
    </section>
  );
}
