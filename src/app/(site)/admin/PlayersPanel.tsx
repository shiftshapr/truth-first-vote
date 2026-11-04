'use client';

import { useEffect, useMemo, useState } from 'react';
import { ROLES } from '@/lib/site';
import { adminFetch, fmt } from './api';

type Player = {
  userId: string;
  playerNumber: number | null;
  email: string | null;
  displayName: string | null;
  username: string | null;
  country: string;
  region: string;
  party: string;
  role: string;
  bring: string;
  points: number;
  updatesOptIn: boolean;
  createdAt: string;
};

const roleLabel = (id: string) => (id === 'player' ? 'Player' : ROLES.find((r) => r.id === id)?.label.replace(/^As an? /, '') || id);

export default function PlayersPanel() {
  const [rows, setRows] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    adminFetch<{ players: Player[] }>('/api/admin/players')
      .then((d) => setRows(d.players))
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!rows || !q) return rows || [];
    return rows.filter((r) =>
      [r.displayName, r.email, r.username, r.country, r.region, r.party, r.bring].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [rows, query]);

  if (error) return <p className="notice notice--error">{error}</p>;
  if (!rows) return <p className="muted">Loading players…</p>;

  const optedIn = rows.filter((r) => r.updatesOptIn && r.email).length;
  const countries = new Set(rows.map((r) => r.country).filter(Boolean)).size;
  const helpers = rows.filter((r) => r.role !== 'player').length;

  return (
    <div className="stack-6">
      <div className="grid-4">
        <div className="card stack-2"><span className="meta muted">Players</span><span className="headline">{rows.length}</span></div>
        <div className="card stack-2"><span className="meta muted">Receiving updates</span><span className="headline">{optedIn}</span></div>
        <div className="card stack-2"><span className="meta muted">Countries</span><span className="headline">{countries}</span></div>
        <div className="card stack-2"><span className="meta muted">Organizers and spokespeople</span><span className="headline">{helpers}</span></div>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <input className="input" style={{ maxWidth: 320 }} placeholder="Search name, email, country, party" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search players" />
        <a className="cs-btn cs-btn--secondary cs-btn--small" href="/api/admin/players?format=csv">Download CSV</a>
      </div>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr><th>#</th><th>Name</th><th>Email</th><th>Country</th><th>Party</th><th>Role</th><th>Points</th><th>Updates</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.userId}>
                <td>{r.playerNumber}</td>
                <td>
                  {r.displayName || r.username || 'Unnamed'}
                  {r.bring ? <div className="small muted">{r.bring}</div> : null}
                </td>
                <td>{r.email || <span className="muted">none</span>}</td>
                <td>{[r.region, r.country].filter(Boolean).join(', ')}</td>
                <td>{r.party}</td>
                <td>{roleLabel(r.role)}</td>
                <td>{r.points}</td>
                <td>{r.updatesOptIn ? 'Yes' : 'No'}</td>
                <td>{fmt(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
