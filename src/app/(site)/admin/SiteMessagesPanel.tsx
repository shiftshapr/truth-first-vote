'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch, fmt } from './api';

type Msg = {
  id: string;
  title: string;
  body: string;
  variant: 'info' | 'live' | 'gathering';
  linkUrl: string | null;
  linkLabel: string | null;
  audience: 'everyone' | 'signed_in' | 'players';
  status: 'draft' | 'live' | 'archived';
  startAt: string | null;
  endAt: string | null;
  updatedAt: string;
};

type Draft = Omit<Msg, 'id' | 'updatedAt'> & { id?: string };

const EMPTY: Draft = {
  title: '', body: '', variant: 'info', linkUrl: '', linkLabel: '', audience: 'everyone', status: 'draft', startAt: null, endAt: null,
};

/** datetime-local wants local time without zone. */
function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function fromLocalInput(v: string) {
  return v ? new Date(v).toISOString() : null;
}

export default function SiteMessagesPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(() => {
    adminFetch<{ messages: Msg[] }>('/api/admin/site-messages').then((d) => setMessages(d.messages)).catch((e) => setNote({ kind: 'error', text: e.message }));
  }, []);
  useEffect(load, [load]);

  async function save(status?: Draft['status']) {
    setBusy(true);
    setNote(null);
    const body = JSON.stringify({ ...draft, status: status || draft.status });
    try {
      if (draft.id) await adminFetch(`/api/admin/site-messages/${draft.id}`, { method: 'PATCH', body });
      else await adminFetch('/api/admin/site-messages', { method: 'POST', body });
      setNote({ kind: 'ok', text: status === 'live' ? 'Live on the site now.' : 'Saved.' });
      setDraft(EMPTY);
      load();
    } catch (e) {
      setNote({ kind: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: Msg) {
    if (!window.confirm(`Delete "${m.title}"?`)) return;
    await adminFetch(`/api/admin/site-messages/${m.id}`, { method: 'DELETE' }).catch(() => {});
    if (draft.id === m.id) setDraft(EMPTY);
    load();
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...draft, [k]: v });

  return (
    <div className="split">
      <div className="stack-4">
        <h2 className="title">{draft.id ? 'Edit message' : 'New site message'}</h2>
        <p className="small muted">A banner across the top of every page. Visitors can dismiss it; editing it shows it again.</p>
        <div className="field"><label htmlFor="m-title">Headline</label><input id="m-title" className="input" maxLength={140} value={draft.title} onChange={(e) => set('title', e.target.value)} /></div>
        <div className="field"><label htmlFor="m-body">Text (optional)</label><input id="m-body" className="input" maxLength={300} value={draft.body} onChange={(e) => set('body', e.target.value)} /></div>
        <div className="grid-2">
          <div className="field"><label htmlFor="m-link">Link (https:// or /path)</label><input id="m-link" className="input" value={draft.linkUrl || ''} onChange={(e) => set('linkUrl', e.target.value)} /></div>
          <div className="field"><label htmlFor="m-label">Link text</label><input id="m-label" className="input" maxLength={60} value={draft.linkLabel || ''} onChange={(e) => set('linkLabel', e.target.value)} /></div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="m-variant">Style</label>
            <select id="m-variant" className="select" value={draft.variant} onChange={(e) => set('variant', e.target.value as Draft['variant'])}>
              <option value="info">Info (canopy tint)</option>
              <option value="live">Live now (signal)</option>
              <option value="gathering">In person (ember tint)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-aud">Who sees it</label>
            <select id="m-aud" className="select" value={draft.audience} onChange={(e) => set('audience', e.target.value as Draft['audience'])}>
              <option value="everyone">Everyone</option>
              <option value="signed_in">Signed-in visitors</option>
              <option value="players">Players only</option>
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="field"><label htmlFor="m-start">Starts (optional)</label><input id="m-start" type="datetime-local" className="input" value={toLocalInput(draft.startAt)} onChange={(e) => set('startAt', fromLocalInput(e.target.value))} /></div>
          <div className="field"><label htmlFor="m-end">Ends (optional)</label><input id="m-end" type="datetime-local" className="input" value={toLocalInput(draft.endAt)} onChange={(e) => set('endAt', fromLocalInput(e.target.value))} /></div>
        </div>
        {note ? <p className={note.kind === 'ok' ? 'notice small' : 'notice notice--error small'} role="status">{note.text}</p> : null}
        <div className="row">
          <button type="button" className="cs-btn" disabled={busy || !draft.title.trim()} onClick={() => void save('live')}>Publish</button>
          <button type="button" className="cs-btn cs-btn--secondary" disabled={busy || !draft.title.trim()} onClick={() => void save('draft')}>Save as draft</button>
          {draft.id ? <button type="button" className="cs-btn cs-btn--secondary" onClick={() => setDraft(EMPTY)}>Cancel</button> : null}
        </div>
      </div>
      <div className="stack-4">
        <h2 className="title">Messages</h2>
        {messages.length ? messages.map((m) => (
          <div key={m.id} className="card stack-2">
            <div className="row">
              <span className={m.status === 'live' ? 'cs-tag cs-tag--signal' : 'cs-tag cs-tag--outline'}>{m.status}</span>
              <span className="small muted">{m.audience.replace('_', ' ')} · updated {fmt(m.updatedAt)}</span>
            </div>
            <strong>{m.title}</strong>
            {m.body ? <span className="small">{m.body}</span> : null}
            {m.startAt || m.endAt ? <span className="small muted">{m.startAt ? `From ${fmt(m.startAt)} ` : ''}{m.endAt ? `until ${fmt(m.endAt)}` : ''}</span> : null}
            <div className="row">
              <button type="button" className="cs-btn cs-btn--secondary cs-btn--small" onClick={() => setDraft({ ...m })}>Edit</button>
              {m.status === 'live' ? (
                <button type="button" className="cs-btn cs-btn--secondary cs-btn--small" onClick={() => void adminFetch(`/api/admin/site-messages/${m.id}`, { method: 'PATCH', body: JSON.stringify({ ...m, status: 'archived' }) }).then(load)}>Take down</button>
              ) : null}
              <button type="button" className="cs-btn cs-btn--danger cs-btn--small" onClick={() => void remove(m)}>Delete</button>
            </div>
          </div>
        )) : <p className="muted">No messages yet.</p>}
      </div>
    </div>
  );
}
