'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { SUPPORT_CATEGORIES } from '@/lib/site';

export default function SupportClient() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', category: 'general', subject: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="card stack-4" role="status">
        <h2 className="title">Thanks, we have it</h2>
        <p>
          We sent a copy to your inbox and will reply there. Your reference is <span className="meta">{done}</span>.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pageUrl: document.referrer || window.location.href }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not send');
      setDone(d.reference || 'received');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form className="stack-4" onSubmit={submit}>
      {user ? (
        <div className="stack-2">
          <p className="small muted">Signed in as {user.displayName || user.username}. We will reply to your account email.</p>
          <div className="field">
            <label htmlFor="email">Reply-to email, only if your account has none</label>
            <input id="email" type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" />
          </div>
        </div>
      ) : (
        <div className="grid-2">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" className="input" value={form.name} onChange={set('name')} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required className="input" value={form.email} onChange={set('email')} autoComplete="email" />
          </div>
        </div>
      )}
      <div className="field">
        <label htmlFor="category">Topic</label>
        <select id="category" className="select" value={form.category} onChange={set('category')}>
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="subject">Subject</label>
        <input id="subject" required maxLength={200} className="input" value={form.subject} onChange={set('subject')} />
      </div>
      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea id="message" required minLength={10} className="textarea" value={form.message} onChange={set('message')} />
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>
      {error ? <p className="notice notice--error small" role="alert">{error}</p> : null}
      <div>
        <button type="submit" className="cs-btn" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
      </div>
    </form>
  );
}
