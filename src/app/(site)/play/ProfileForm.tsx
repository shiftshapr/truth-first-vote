'use client';

import { useState } from 'react';
import { COUNTRIES } from '@/lib/countries';
import { PARTY_SUGGESTIONS, ROLES } from '@/lib/site';

export type ProfileValues = {
  country: string;
  region: string;
  party: string;
  role: string;
  bring: string;
  showOnLeaderboard: boolean;
  updatesOptIn: boolean;
};

export const EMPTY_PROFILE: ProfileValues = {
  country: '', region: '', party: '', role: 'player', bring: '', showOnLeaderboard: false, updatesOptIn: true,
};

/** The player profile: used to join the game and, later, to edit it. */
export default function ProfileForm({
  initial,
  joining,
  invite,
  onSaved,
}: {
  initial: ProfileValues;
  joining: boolean;
  invite?: string | null;
  onSaved: (data: { created: boolean }) => void;
}) {
  const [v, setV] = useState<ProfileValues>(initial);
  const [agree, setAgree] = useState(!joining);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ProfileValues>(k: K, val: ProfileValues[K]) => setV({ ...v, [k]: val });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!v.country.trim()) return setError('Which country are you in?');
    if (!agree) return setError("Please tick the box to confirm you've read what this is.");
    setBusy(true);
    try {
      const res = await fetch('/api/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...v, agree, invite: invite || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save. Try again in a moment.');
      onSaved({ created: Boolean(data.created) });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack-4" onSubmit={save} noValidate>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="p-country">Country</label>
          <input id="p-country" className="input" list="p-country-list" maxLength={60} required value={v.country}
            placeholder="Start typing" autoComplete="country-name" onChange={(e) => set('country', e.target.value)} />
          <datalist id="p-country-list">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="field">
          <label htmlFor="p-region">State, region or city <span className="muted">(optional)</span></label>
          <input id="p-region" className="input" maxLength={60} value={v.region} onChange={(e) => set('region', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p-party">Your party now <span className="muted">(you keep it)</span></label>
          <input id="p-party" className="input" list="p-party-list" maxLength={60} value={v.party}
            placeholder="Democrat, Republican, any party, or none" onChange={(e) => set('party', e.target.value)} />
          <datalist id="p-party-list">{PARTY_SUGGESTIONS.map((p) => <option key={p} value={p} />)}</datalist>
        </div>
        <div className="field">
          <label htmlFor="p-role">How do you want to play?</label>
          <select id="p-role" className="input" value={v.role} onChange={(e) => set('role', e.target.value)}>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="p-bring">What would you bring to the game? <span className="muted">(optional)</span></label>
        <textarea id="p-bring" className="textarea" maxLength={1000} value={v.bring}
          placeholder="A skill, a language, an issue you care about, a question you want answered truthfully"
          onChange={(e) => set('bring', e.target.value)} />
      </div>
      <label className="check">
        <input type="checkbox" checked={v.showOnLeaderboard} onChange={(e) => set('showOnLeaderboard', e.target.checked)} />
        Show my name on the leaderboard (otherwise it says &quot;A player from {v.country.trim() || 'your country'}&quot;)
      </label>
      <label className="check">
        <input type="checkbox" checked={v.updatesOptIn} onChange={(e) => set('updatesOptIn', e.target.checked)} />
        Email me game updates and new quests
      </label>
      {joining ? (
        <label className="check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I understand Truth First is an imaginary party and a game. It doesn&apos;t take money or endorse candidates.
        </label>
      ) : null}
      {error ? <p className="notice notice--error small" role="alert">{error}</p> : null}
      <div>
        <button type="submit" className="cs-btn" disabled={busy}>
          {busy ? 'Saving…' : joining ? 'Join the game' : 'Save my profile'}
        </button>
      </div>
    </form>
  );
}
