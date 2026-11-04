'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch, fmt } from './api';

type Reply = { id: string; body: string; author: string; emailed: boolean; createdAt: string };
type Ticket = {
  id: string;
  email: string;
  name: string | null;
  category: string;
  subject: string;
  body: string;
  pageUrl: string | null;
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
  updatedAt: string;
  replies?: Reply[];
};

const FILTERS = ['open', 'answered', 'closed', 'all'] as const;

export default function SupportPanel({ initialTicket }: { initialTicket: string | null }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('open');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [current, setCurrent] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(() => {
    const q = filter === 'all' ? '' : `?status=${filter}`;
    adminFetch<{ tickets: Ticket[] }>(`/api/admin/support${q}`).then((d) => setTickets(d.tickets)).catch((e) => setNote({ kind: 'error', text: e.message }));
  }, [filter]);
  useEffect(load, [load]);

  const open = useCallback((id: string) => {
    setNote(null);
    setReply('');
    adminFetch<{ ticket: Ticket }>(`/api/admin/support/${id}`).then((d) => setCurrent(d.ticket)).catch((e) => setNote({ kind: 'error', text: e.message }));
  }, []);

  useEffect(() => {
    if (initialTicket) open(initialTicket);
  }, [initialTicket, open]);

  async function send() {
    if (!current) return;
    setBusy(true);
    setNote(null);
    try {
      const d = await adminFetch<{ emailed: boolean; emailError: string | null }>(`/api/admin/support/${current.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body: reply }),
      });
      setNote(d.emailed ? { kind: 'ok', text: `Reply emailed to ${current.email}.` } : { kind: 'error', text: `Saved, but the email failed: ${d.emailError}` });
      setReply('');
      open(current.id);
      load();
    } catch (e) {
      setNote({ kind: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: Ticket['status']) {
    if (!current) return;
    await adminFetch(`/api/admin/support/${current.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }).catch(() => {});
    open(current.id);
    load();
  }

  return (
    <div className="split">
      <div className="stack-4">
        <div className="row">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={filter === f ? 'cs-btn cs-btn--small' : 'cs-btn cs-btn--secondary cs-btn--small'} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {tickets.length ? tickets.map((t) => (
          <button key={t.id} type="button" className="list-btn stack-2" aria-current={current?.id === t.id} onClick={() => open(t.id)}>
            <span className="row"><span className="cs-tag cs-tag--outline">{t.status}</span><span className="small muted">{fmt(t.updatedAt)}</span></span>
            <strong style={{ display: 'block' }}>{t.subject}</strong>
            <span className="small muted">{t.name ? `${t.name} · ` : ''}{t.email}</span>
          </button>
        )) : <p className="muted">No {filter === 'all' ? '' : filter} tickets.</p>}
      </div>
      <div className="stack-4">
        {current ? (
          <>
            <div className="stack-2">
              <h2 className="title">{current.subject}</h2>
              <p className="small muted">
                {current.name ? `${current.name} · ` : ''}<a href={`mailto:${current.email}`}>{current.email}</a> · {current.category} · {fmt(current.createdAt)}
                {current.pageUrl ? <> · from {current.pageUrl}</> : null}
              </p>
            </div>
            <div className="preview-frame" style={{ whiteSpace: 'pre-wrap' }}>{current.body}</div>
            {current.replies?.map((r) => (
              <div key={r.id} className="card stack-2" style={{ background: 'var(--canopy-soft)' }}>
                <span className="small muted">{r.author} · {fmt(r.createdAt)}{r.emailed ? '' : ' · email failed'}</span>
                <div style={{ whiteSpace: 'pre-wrap' }}>{r.body}</div>
              </div>
            ))}
            <div className="field">
              <label htmlFor="reply">Reply (Markdown, sent by email)</label>
              <textarea id="reply" className="textarea" value={reply} onChange={(e) => setReply(e.target.value)} />
            </div>
            {note ? <p className={note.kind === 'ok' ? 'notice small' : 'notice notice--error small'} role="status">{note.text}</p> : null}
            <div className="row">
              <button type="button" className="cs-btn" disabled={busy || !reply.trim()} onClick={() => void send()}>{busy ? 'Sending…' : 'Send reply'}</button>
              {current.status !== 'closed' ? (
                <button type="button" className="cs-btn cs-btn--secondary" onClick={() => void setStatus('closed')}>Close</button>
              ) : (
                <button type="button" className="cs-btn cs-btn--secondary" onClick={() => void setStatus('open')}>Reopen</button>
              )}
            </div>
          </>
        ) : (
          <p className="muted">Pick a ticket to read and reply.</p>
        )}
      </div>
    </div>
  );
}
