'use client';

import { useCallback, useEffect, useState } from 'react';
import { QUESTS } from '@/lib/site';
import { adminFetch, fmt } from './api';

type Submission = {
  id: string;
  questId: string;
  url: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string;
  reviewedBy: string | null;
  createdAt: string;
  player?: { name: string; email: string | null; country: string; party: string };
};

const FILTERS = ['pending', 'approved', 'rejected', 'all'] as const;

export default function QuestsPanel() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('pending');
  const [rows, setRows] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setRows(null);
    adminFetch<{ submissions: Submission[] }>(`/api/admin/quests?status=${filter}`)
      .then((d) => setRows(d.submissions))
      .catch((e) => setError(e.message));
  }, [filter]);
  useEffect(load, [load]);

  async function review(id: string, approve: boolean) {
    setBusy(id);
    setError(null);
    try {
      await adminFetch('/api/admin/quests', { method: 'POST', body: JSON.stringify({ id, approve, note: notes[id] || '' }) });
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack-6">
      <p className="muted">
        Quests players hand in for review. Approving awards the quest&apos;s points once. Check that a declaration is
        public, a steelman is fair to the other side, and a sourced claim names who disputes it.
      </p>
      <div className="row">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={filter === f ? 'cs-btn cs-btn--small' : 'cs-btn cs-btn--secondary cs-btn--small'} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {error ? <p className="notice notice--error">{error}</p> : null}
      {!rows ? <p className="muted">Loading…</p> : rows.length === 0 ? <p className="muted">Nothing here.</p> : null}
      {rows?.map((s) => {
        const quest = QUESTS.find((q) => q.id === s.questId);
        return (
          <div key={s.id} className="card stack-4">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="cs-tag">{quest?.name || s.questId} · {quest?.points ?? 0} pts</span>
              <span className="small muted">{fmt(s.createdAt)}</span>
            </div>
            <p className="small">
              <strong>{s.player?.name}</strong> {s.player?.email ? `(${s.player.email})` : ''} · {s.player?.country}
              {s.player?.party ? ` · ${s.player.party}` : ''}
            </p>
            {s.url ? <p><a href={s.url} target="_blank" rel="noopener noreferrer nofollow">{s.url}</a></p> : null}
            {s.body ? <p style={{ whiteSpace: 'pre-wrap' }}>{s.body}</p> : null}
            {s.status === 'pending' ? (
              <div className="stack-2">
                <input className="input" placeholder="Note to keep with the review (optional)" value={notes[s.id] || ''} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })} />
                <div className="row">
                  <button type="button" className="cs-btn cs-btn--small" disabled={busy === s.id} onClick={() => void review(s.id, true)}>Approve</button>
                  <button type="button" className="cs-btn cs-btn--secondary cs-btn--small" disabled={busy === s.id} onClick={() => void review(s.id, false)}>Reject</button>
                </div>
              </div>
            ) : (
              <p className="small muted">{s.status} by {s.reviewedBy}{s.reviewNote ? `: ${s.reviewNote}` : ''}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
