import type { Metadata } from 'next';
import { Suspense } from 'react';
import UnsubscribeClient from './UnsubscribeClient';

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false } };

export default function UnsubscribePage() {
  return (
    <section className="section">
      <div className="wrap narrow stack-6">
        <h1 className="headline">Unsubscribe from Truth First emails</h1>
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <UnsubscribeClient />
        </Suspense>
      </div>
    </section>
  );
}
