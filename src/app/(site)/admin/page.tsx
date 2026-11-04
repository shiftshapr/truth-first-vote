import type { Metadata } from 'next';
import { Suspense } from 'react';
import AdminClient from './AdminClient';

export const metadata: Metadata = { title: 'Admin', robots: { index: false } };

export default function AdminPage() {
  return (
    <section className="section" style={{ paddingTop: 'var(--space-10)' }}>
      <div className="wrap">
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <AdminClient />
        </Suspense>
      </div>
    </section>
  );
}
