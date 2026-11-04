'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FOUNDER_GOAL, QUESTS, questById } from '@/lib/site';
import ProfileForm, { EMPTY_PROFILE } from './ProfileForm';

type Player = {
  displayName: string | null;
  username: string | null;
  country: string;
  party: string;
  playerNumber: number | null;
  points: number;
};
type Submission = { id: string; questId: string; status: 'pending' | 'approved' | 'rejected'; reviewNote: string; createdAt: string };
type Leader = { rank: number; name: string; country: string; points: number; you: boolean };
type PlayData = {
  player: Player | null;
  history?: { questId: string; points: number; reason: string; at: string }[];
  submissions?: Submission[];
  leaders?: Leader[];
  inviteUrl?: string;
};

const INVITE_KEY = 'tf_invite';

function rememberInvite(): string | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('invite');
    if (fromUrl) sessionStorage.setItem(INVITE_KEY, fromUrl);
    return fromUrl || sessionStorage.getItem(INVITE_KEY);
  } catch {
    return null;
  }
}

export default function PlayClient() {
  const { user, checked, login, loginBusy } = useAuth();
  const [data, setData] = useState<PlayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(false);

  useEffect(() => setInvite(rememberInvite()), []);

  const load = useCallback(() => {
    fetch('/api/play')
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || 'The game is unavailable right now.');
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (checked && user) load();
  }, [checked, user, load]);

  if (!checked) return <p className="muted">Loading…</p>;

  if (!user) {
    return (
      <div className="card stack-4" style={{ maxWidth: 560 }}>
        <h1 className="headline">Sign in to play</h1>
        <p>
          Everyone who plays signs in, so we know who to give the points to. It&apos;s the same Web3Auth sign-in (Google or
          email) used across the Meta-Layer sites.
        </p>
        {invite ? <p className="small muted">You were invited by another player. Sign in to accept.</p> : null}
        <div>
          <button type="button" className="cs-btn" disabled={loginBusy} onClick={() => void login().catch(() => {})}>
            {loginBusy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    );
  }

  if (error) return <p className="notice notice--error">{error}</p>;
  if (!data) return <p className="muted">Loading your game…</p>;

  if (!data.player) {
    return (
      <div className="stack-6" style={{ maxWidth: 760 }}>
        <div className="stack-2">
          <p className="meta muted">Season 0</p>
          <h1 className="headline">Join the game</h1>
          <p className="muted">
            Tell us where you are and how you want to play. You keep your party: Truth First sits on top of it. Joining
            earns your first {questById('join')?.points} points.
          </p>
        </div>
        <div className="card">
          <ProfileForm
            initial={EMPTY_PROFILE}
            joining
            invite={invite}
            onSaved={() => {
              try { sessionStorage.removeItem(INVITE_KEY); } catch { /* private mode */ }
              setWelcome(true);
              load();
            }}
          />
        </div>
      </div>
    );
  }

  return <Dashboard data={data} welcome={welcome} reload={load} />;
}

function Dashboard({ data, welcome, reload }: { data: PlayData; welcome: boolean; reload: () => void }) {
  const p = data.player!;
  const subs = data.submissions || [];
  const history = data.history || [];
  const bridgeCount = history.filter((h) => h.questId === 'bridge').length;
  const [copied, setCopied] = useState<string | null>(null);

  const declarePost =
    (p.party && !/^(none|no party)$/i.test(p.party) ? `I'm ${/^[aeiou]/i.test(p.party) ? 'an' : 'a'} ${p.party}. I'm also Truth First.` : "I'm Truth First.") +
    ` Keep your party, put truth first. ${data.inviteUrl || 'truthfirst.vote'}`;

  function copy(text: string, key: string) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
      () => setCopied(key),
      () => setCopied(`${key}-fail`),
    );
  }

  function questState(id: string): { label: string; done: boolean } {
    const q = questById(id)!;
    if (q.kind === 'auto') {
      if (id === 'join') return { label: 'Done', done: true };
      return { label: bridgeCount ? `Earned ${bridgeCount}×` : 'Open', done: false };
    }
    const mine = subs.filter((s) => s.questId === id);
    if (mine.some((s) => s.status === 'approved')) return { label: 'Done', done: true };
    if (mine.some((s) => s.status === 'pending')) return { label: 'Waiting for review', done: false };
    if (mine.some((s) => s.status === 'rejected')) return { label: 'Not accepted, try again', done: false };
    return { label: 'Open', done: false };
  }

  return (
    <div className="stack-10">
      {welcome ? (
        <div className="card card--canopy stack-2">
          <h2 className="title">You&apos;re founding player #{p.playerNumber}.</h2>
          <p>Your first move is to declare it. Start with the quest below.</p>
        </div>
      ) : null}

      <div className="grid-3">
        <div className="card stack-2">
          <span className="meta muted">Your points</span>
          <span className="points-big">{p.points}</span>
        </div>
        <div className="card stack-2">
          <span className="meta muted">Player</span>
          <span className="title">#{p.playerNumber} · {p.displayName || p.username || 'You'}</span>
          <span className="small muted">{p.country}{p.party ? ` · ${p.party} and Truth First` : ''}</span>
          <Link href="/play/profile" className="small">Edit my profile</Link>
        </div>
        <div className="card stack-2">
          <span className="meta muted">The game starts at {FOUNDER_GOAL}</span>
          <p className="small">
            These are Season 0 quests. When {FOUNDER_GOAL} founding players have joined, we write the real rules together
            on Canopi, and your points carry over.
          </p>
        </div>
      </div>

      <section className="stack-4">
        <h2 className="headline">How to play</h2>
        <ol className="stack-2" style={{ margin: 0, paddingLeft: 20 }}>
          <li>Do quests. Some score the moment you do them; others an admin reviews first, usually within a few days.</li>
          <li>You score for being good at truth: declaring, bridging, steelmanning and sourcing. Never for loyalty or shouting.</li>
          <li>Keep your party. Truth First is an overlay, so a Democrat and a Republican can both play and both win.</li>
          <li>Be fair. A steelman that mocks the other side, or a claim that hides who disputes it, won&apos;t be accepted.</li>
        </ol>
      </section>

      <section className="stack-4">
        <h2 className="headline">Quests</h2>
        <div className="stack-4">
          {QUESTS.map((q) => {
            const st = questState(q.id);
            return (
              <div key={q.id} className={`card stack-4${st.done ? ' quest--done' : ''}`}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="cs-tag">{q.skill} · {q.points} pts{q.repeatable ? ' each' : ''}</span>
                  <span className={st.done ? 'cs-tag cs-tag--signal' : 'cs-tag cs-tag--outline'}>{st.label}</span>
                </div>
                <h3 className="title">{q.name}</h3>
                <p className="muted">{q.how}</p>
                {q.id === 'declare' && !st.done ? (
                  <div className="stack-2">
                    <p className="small">A post you can copy:</p>
                    <p className="copy-box">{declarePost}</p>
                    <div>
                      <button type="button" className="cs-btn cs-btn--secondary cs-btn--small" onClick={() => copy(declarePost, 'post')}>
                        {copied === 'post' ? 'Copied' : copied === 'post-fail' ? 'Select the text to copy it' : 'Copy post'}
                      </button>
                    </div>
                  </div>
                ) : null}
                {q.id === 'bridge' && data.inviteUrl ? (
                  <div className="stack-2">
                    <p className="small">Your invite link:</p>
                    <p className="copy-box" style={{ fontStyle: 'normal' }}>{data.inviteUrl}</p>
                    <div>
                      <button type="button" className="cs-btn cs-btn--secondary cs-btn--small" onClick={() => copy(data.inviteUrl!, 'invite')}>
                        {copied === 'invite' ? 'Copied' : copied === 'invite-fail' ? 'Select the link to copy it' : 'Copy invite link'}
                      </button>
                    </div>
                  </div>
                ) : null}
                {q.kind === 'review' && !st.done && st.label !== 'Waiting for review' ? (
                  <QuestSubmit questId={q.id} evidence={'evidence' in q ? q.evidence : 'text'} onDone={reload} />
                ) : null}
                {subs.filter((s) => s.questId === q.id && s.status === 'rejected' && s.reviewNote).slice(0, 1).map((s) => (
                  <p key={s.id} className="small muted">Reviewer&apos;s note: {s.reviewNote}</p>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section className="stack-4">
        <h2 className="headline">Leaderboard</h2>
        {data.leaders?.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>#</th><th>Player</th><th>Country</th><th>Points</th></tr></thead>
              <tbody>
                {data.leaders.map((l) => (
                  <tr key={l.rank} style={l.you ? { fontWeight: 700 } : undefined}>
                    <td>{l.rank}</td><td>{l.name}{l.you ? ' (you)' : ''}</td><td>{l.country}</td><td>{l.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">No points yet.</p>}
      </section>

      {history.length ? (
        <section className="stack-4">
          <h2 className="headline">Your points</h2>
          <ul className="stack-2" style={{ margin: 0, paddingLeft: 20 }}>
            {history.map((h, i) => (
              <li key={i}>+{h.points} · {h.reason} <span className="small muted">({new Date(h.at).toLocaleDateString()})</span></li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function QuestSubmit({ questId, evidence, onDone }: { questId: string; evidence: string; onDone: () => void }) {
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsUrl = evidence.includes('url');
  const needsText = evidence.includes('text');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId, url, body }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not hand that in.');
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack-2" onSubmit={submit} noValidate>
      {needsUrl ? (
        <input className="input" type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Link" />
      ) : null}
      {needsText ? (
        <textarea className="textarea" value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} aria-label="Your answer"
          placeholder={questId === 'steelman' ? 'The view you disagree with, then its strongest case' : 'The claim, and who disputes it'} />
      ) : null}
      {error ? <p className="notice notice--error small" role="alert">{error}</p> : null}
      <div><button type="submit" className="cs-btn cs-btn--small" disabled={busy}>{busy ? 'Handing in…' : 'Hand it in'}</button></div>
    </form>
  );
}
