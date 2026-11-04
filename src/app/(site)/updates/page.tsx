import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublicUpdates, type BroadcastRecord } from '@/lib/broadcasts';

export const metadata: Metadata = { title: 'Updates' };
export const dynamic = 'force-dynamic';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function UpdatesPage() {
  let updates: BroadcastRecord[] = [];
  try {
    updates = await listPublicUpdates();
  } catch {
    updates = [];
  }
  return (
    <section className="section">
      <div className="wrap narrow stack-6">
        <div className="stack-4">
          <p className="meta muted">Updates</p>
          <h1 className="display-l">From Truth First</h1>
          <p className="lead muted">
            The emails we send to players, kept here for anyone to read. <Link href="/play">Join the game</Link> to get them in
            your inbox.
          </p>
        </div>
        {updates.length ? (
          <ul className="stack-4" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {updates.map((u) => (
              <li key={u.id} className="card stack-2">
                <span className="meta muted">{formatDate(u.sentAt)}</span>
                <h2 className="title"><Link href={`/updates/${u.id}`}>{u.subject}</Link></h2>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No updates yet. The first one goes out soon.</p>
        )}
      </div>
    </section>
  );
}
