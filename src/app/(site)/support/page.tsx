import type { Metadata } from 'next';
import SupportClient from './SupportClient';

export const metadata: Metadata = { title: 'Support' };

export default function SupportPage() {
  return (
    <section className="section">
      <div className="wrap narrow stack-6">
        <div className="stack-4">
          <p className="meta muted">Support</p>
          <h1 className="display-l">How can we help?</h1>
          <p className="lead muted">
            Questions about playing, points, your profile or starting a Truth Country. A person reads every message and replies by
            email.
          </p>
        </div>
        <SupportClient />
      </div>
    </section>
  );
}
