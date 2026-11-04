'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function UnsubscribeClient() {
  const token = useSearchParams().get('token') || '';
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  if (!token) return <p>This link is missing its token. Use the link at the bottom of any Truth First email.</p>;
  if (state === 'done') {
    return (
      <p className="notice" role="status">
        Done. You will not get more Truth First emails. Your player profile and points stay, and you can turn updates back on from{' '}
        <Link href="/play/profile">your player profile</Link>.
      </p>
    );
  }

  async function confirm() {
    setState('busy');
    const res = await fetch('/api/broadcast/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => null);
    if (res?.ok) {
      setState('done');
      return;
    }
    const d = await res?.json().catch(() => ({}));
    setError(d?.error || 'Could not unsubscribe right now.');
    setState('error');
  }

  return (
    <div className="stack-4">
      <p>Stop all Truth First update emails to this address?</p>
      {state === 'error' ? <p className="notice notice--error small" role="alert">{error}</p> : null}
      <div>
        <button type="button" className="cs-btn" disabled={state === 'busy'} onClick={() => void confirm()}>
          {state === 'busy' ? 'Unsubscribing…' : 'Unsubscribe'}
        </button>
      </div>
    </div>
  );
}
