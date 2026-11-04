import type { Metadata } from 'next';
import PlayClient from './PlayClient';

export const metadata: Metadata = { title: 'Play', robots: { index: false } };

export default function PlayPage() {
  return (
    <section className="section">
      <div className="wrap">
        <PlayClient />
      </div>
    </section>
  );
}
