'use client';

import { useEffect, useState } from 'react';

type Stats = { players: number; goal: number; countries: { name: string; count: number }[]; threshold: number };

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});
  }, []);
  return stats;
}

/** "N of 100 founding players" with a progress bar. */
export default function FounderCounter() {
  const stats = useStats();
  const count = stats?.players ?? 0;
  const goal = stats?.goal ?? 100;
  const left = Math.max(0, goal - count);
  return (
    <div className="counter stack-2" aria-live="polite">
      <div className="row small" style={{ justifyContent: 'space-between' }}>
        <span><strong className="title">{count}</strong> of {goal} founding players</span>
        <span className="muted">{left ? `${left} to go` : "We're starting!"}</span>
      </div>
      <div className="bar"><i style={{ width: `${Math.min(100, (count / goal) * 100)}%` }} /></div>
    </div>
  );
}

/** Players by country, counts only. */
export function CountryBars() {
  const stats = useStats();
  if (!stats) return <p className="muted">Loading…</p>;
  if (!stats.countries.length) return <p className="muted">No players yet. Be the first in your country.</p>;
  const max = Math.max(stats.threshold, stats.countries[0].count);
  return (
    <div className="stack-2">
      {stats.countries.map((c) => (
        <div key={c.name} className="country-row">
          <span>{c.name}{c.count >= stats.threshold ? ' ✓' : ''}</span>
          <div className="bar"><i style={{ width: `${Math.min(100, (c.count / max) * 100)}%` }} /></div>
          <strong>{c.count}</strong>
        </div>
      ))}
    </div>
  );
}
