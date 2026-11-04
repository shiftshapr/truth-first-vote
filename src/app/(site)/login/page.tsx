import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="wrap section muted">Loading sign-in…</div>}>
      <LoginClient />
    </Suspense>
  );
}
