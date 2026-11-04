'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from './api';

export default function AdminsPanel({ self }: { self: string }) {
  const [fromEnv, setFromEnv] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    adminFetch<{ fromEnv: string[]; added: string[] }>('/api/admin/users')
      .then((d) => {
        setFromEnv(d.fromEnv);
        setAdded(d.added);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await adminFetch('/api/admin/users', { method: 'POST', body: JSON.stringify({ email }) });
      setEmail('');
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(target: string) {
    if (!window.confirm(`Remove admin access for ${target}?`)) return;
    await adminFetch(`/api/admin/users?email=${encodeURIComponent(target)}`, { method: 'DELETE' }).catch((e) => setError(e.message));
    load();
  }

  return (
    <div className="stack-6 narrow">
      <p className="muted">
        Admins sign in with Web3Auth like everyone else; access is granted by the email on their account.
      </p>
      <div className="stack-2">
        <h2 className="title">From server config</h2>
        <p className="small muted">Set in TF_ADMIN_EMAILS; change these on the server.</p>
        <ul>{fromEnv.map((e) => <li key={e}>{e}</li>)}</ul>
      </div>
      <div className="stack-2">
        <h2 className="title">Added here</h2>
        {added.length ? (
          <ul className="stack-2" style={{ listStyle: 'none', padding: 0 }}>
            {added.map((e) => (
              <li key={e} className="row">
                {e}
                {e !== self ? <button type="button" className="cs-btn cs-btn--danger cs-btn--small" onClick={() => void remove(e)}>Remove</button> : null}
              </li>
            ))}
          </ul>
        ) : <p className="muted">None yet.</p>}
      </div>
      <form className="row" onSubmit={add}>
        <input type="email" required className="input" style={{ maxWidth: 320 }} placeholder="name@example.org" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Admin email" />
        <button type="submit" className="cs-btn">Add admin</button>
      </form>
      {error ? <p className="notice notice--error small">{error}</p> : null}
    </div>
  );
}
