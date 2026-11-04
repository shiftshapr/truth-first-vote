'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/** Signed in: go to the game. Signed out: sign in with Web3Auth first, then go. */
export default function PlayButton({ label = 'Sign in to play', className = 'cs-btn' }: { label?: string; className?: string }) {
  const { user, login, loginBusy } = useAuth();
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      disabled={loginBusy}
      onClick={async () => {
        if (!user) {
          try { await login(); } catch { return; }
        }
        router.push('/play');
      }}
    >
      {loginBusy ? 'Signing in…' : user ? 'Go to the game' : label}
    </button>
  );
}
