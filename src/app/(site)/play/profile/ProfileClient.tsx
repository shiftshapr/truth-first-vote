'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProfileForm, { type ProfileValues } from '../ProfileForm';

export default function ProfileClient() {
  const { user, checked, login, loginBusy } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<ProfileValues | null>(null);
  const [missing, setMissing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checked || !user) return;
    fetch('/api/player')
      .then((r) => r.json())
      .then((d) => {
        if (!d.player) return setMissing(true);
        const p = d.player;
        setValues({ country: p.country, region: p.region, party: p.party, role: p.role, bring: p.bring,
          showOnLeaderboard: p.showOnLeaderboard, updatesOptIn: p.updatesOptIn });
      })
      .catch(() => setError('Could not load your profile.'));
  }, [checked, user]);

  if (!checked) return <p className="muted">Loading…</p>;
  if (!user) {
    return (
      <div>
        <button type="button" className="cs-btn" disabled={loginBusy} onClick={() => void login().catch(() => {})}>
          {loginBusy ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    );
  }
  if (error) return <p className="notice notice--error">{error}</p>;
  if (missing) return <p>You haven&apos;t joined yet. <Link href="/play">Join the game</Link>.</p>;
  if (!values) return <p className="muted">Loading…</p>;

  async function leave() {
    if (!window.confirm('Leave the game? This deletes your profile, quests and points. It cannot be undone.')) return;
    const res = await fetch('/api/player', { method: 'DELETE' });
    if (res.ok) router.push('/');
    else setError('Could not delete. Write to hello@truthfirst.vote and we will do it.');
  }

  return (
    <div className="stack-6">
      <div className="card">
        <ProfileForm initial={values} joining={false} onSaved={() => setSaved(true)} />
        {saved ? <p className="small" role="status">Saved. <Link href="/play">Back to the game</Link></p> : null}
      </div>
      <div className="stack-2">
        <h2 className="title">Leave the game</h2>
        <p className="small muted">Deletes your player profile, quest submissions and points.</p>
        <div><button type="button" className="cs-btn cs-btn--danger cs-btn--small" onClick={() => void leave()}>Leave and delete my data</button></div>
      </div>
    </div>
  );
}
