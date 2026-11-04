'use client';

import { useCallback, useEffect, useState } from 'react';
import { COUNTRIES } from '@/lib/countries';
import { ROLES } from '@/lib/site';
import { adminFetch, fmt } from './api';

type Broadcast = {
  id: string;
  subject: string;
  sentAt: string;
  sentBy: string | null;
  testMode: boolean;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  publicArchive: boolean;
};

const DRAFT_KEY = 'tf_broadcast_draft';

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export default function BroadcastPanel() {
  const [subject, setSubject] = useState('');
  const [bodyMd, setBodyMd] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [countryInput, setCountryInput] = useState('');
  const [publicArchive, setPublicArchive] = useState(true);
  const [audience, setAudience] = useState<{ count: number; sample: string[] } | null>(null);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [busy, setBusy] = useState<'' | 'test' | 'send'>('');
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
      if (d.subject) setSubject(d.subject);
      if (d.bodyMd) setBodyMd(d.bodyMd);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ subject, bodyMd }));
    } catch {
      /* ignore */
    }
  }, [subject, bodyMd]);

  const loadHistory = useCallback(() => {
    adminFetch<{ broadcasts: Broadcast[] }>('/api/admin/broadcast').then((d) => setHistory(d.broadcasts)).catch(() => {});
  }, []);

  useEffect(loadHistory, [loadHistory]);

  useEffect(() => {
    let cancelled = false;
    adminFetch<{ count: number; sample: string[] }>('/api/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ action: 'audience', audience: { countries, roles } }),
    })
      .then((d) => !cancelled && setAudience(d))
      .catch(() => !cancelled && setAudience(null));
    return () => {
      cancelled = true;
    };
  }, [countries, roles]);

  async function sendTest() {
    setBusy('test');
    setNote(null);
    try {
      const d = await adminFetch<{ to: string }>('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({ action: 'test', subject, bodyMd }),
      });
      setNote({ kind: 'ok', text: `Test sent to ${d.to}.` });
      loadHistory();
    } catch (e) {
      setNote({ kind: 'error', text: (e as Error).message });
    } finally {
      setBusy('');
    }
  }

  async function sendAll() {
    if (!audience?.count) return;
    if (!window.confirm(`Send "${subject}" to ${audience.count} people? This cannot be undone.`)) return;
    setBusy('send');
    setNote(null);
    try {
      const d = await adminFetch<{ record: Broadcast; failures: Array<{ email: string; error: string }> }>(
        '/api/admin/broadcast',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'send',
            subject,
            bodyMd,
            publicArchive,
            audience: { countries, roles },
            confirmCount: audience.count,
          }),
        },
      );
      const failed = d.record.failureCount;
      setNote({
        kind: failed ? 'error' : 'ok',
        text: `Sent to ${d.record.successCount} of ${d.record.recipientCount}.${failed ? ` ${failed} failed: ${d.failures.map((f) => f.email).join(', ')}` : ''}`,
      });
      setSubject('');
      setBodyMd('');
      loadHistory();
    } catch (e) {
      setNote({ kind: 'error', text: (e as Error).message });
    } finally {
      setBusy('');
    }
  }

  async function setArchive(b: Broadcast, value: boolean) {
    await adminFetch(`/api/admin/broadcast/${b.id}`, { method: 'PATCH', body: JSON.stringify({ publicArchive: value }) }).catch(() => {});
    loadHistory();
  }

  const ready = subject.trim() && bodyMd.trim();

  return (
    <div className="split">
      <div className="stack-4">
        <h2 className="title">Compose</h2>
        <div className="field">
          <label htmlFor="b-subject">Subject</label>
          <input id="b-subject" className="input" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="b-body">Message (Markdown)</label>
          <textarea id="b-body" className="textarea" style={{ minHeight: 280 }} value={bodyMd} onChange={(e) => setBodyMd(e.target.value)} />
          <p className="small muted">Each email opens with the person&apos;s first name and ends with their own unsubscribe link.</p>
        </div>
        <fieldset className="stack-2" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label">Audience: players who opted in, narrowed by country and by role (leave empty for everyone)</legend>
          <div className="row">
            <input className="input" style={{ maxWidth: 260 }} list="b-country-list" placeholder="Add a country" value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                const c = countryInput.trim();
                if (c && !countries.includes(c)) setCountries([...countries, c]);
                setCountryInput('');
              }} />
            <datalist id="b-country-list">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
            {countries.map((c) => (
              <button key={c} type="button" className="cs-tag" onClick={() => setCountries(countries.filter((x) => x !== c))} title="Remove">{c} ×</button>
            ))}
          </div>
          <div className="row">
            {ROLES.map((r) => (
              <label key={r.id} className="check"><input type="checkbox" checked={roles.includes(r.id)} onChange={() => setRoles(toggle(roles, r.id))} />{r.label.replace(/^As an? /, '')}</label>
            ))}
          </div>
          <p className="small">
            {audience ? <><strong>{audience.count}</strong> recipients{audience.sample.length ? `, e.g. ${audience.sample.slice(0, 3).join(', ')}` : ''}</> : 'Counting…'}
          </p>
        </fieldset>
        <label className="check">
          <input type="checkbox" checked={publicArchive} onChange={(e) => setPublicArchive(e.target.checked)} />
          Also publish on the public Updates page
        </label>
        {note ? <p className={note.kind === 'ok' ? 'notice small' : 'notice notice--error small'} role="status">{note.text}</p> : null}
        <div className="row">
          <button type="button" className="cs-btn cs-btn--secondary" disabled={!ready || Boolean(busy)} onClick={() => void sendTest()}>
            {busy === 'test' ? 'Sending test…' : 'Send me a test'}
          </button>
          <button type="button" className="cs-btn" disabled={!ready || !audience?.count || Boolean(busy)} onClick={() => void sendAll()}>
            {busy === 'send' ? 'Sending…' : `Send to ${audience?.count ?? 0}`}
          </button>
        </div>
      </div>
      <div className="stack-4">
        <h2 className="title">Sent</h2>
        {history.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Subject</th><th>Sent</th><th>Delivered</th><th>Public</th></tr></thead>
              <tbody>
                {history.map((b) => (
                  <tr key={b.id}>
                    <td>{b.testMode ? <span className="cs-tag cs-tag--outline">Test</span> : null} {b.subject}</td>
                    <td>{fmt(b.sentAt)}<div className="small muted">{b.sentBy}</div></td>
                    <td>{b.successCount}/{b.recipientCount}</td>
                    <td>
                      {b.testMode ? '' : (
                        <input type="checkbox" aria-label="Show on Updates page" checked={b.publicArchive} onChange={(e) => void setArchive(b, e.target.checked)} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Nothing sent yet.</p>
        )}
      </div>
    </div>
  );
}
