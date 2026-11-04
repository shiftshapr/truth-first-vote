import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = { title: 'My player profile', robots: { index: false } };

export default function ProfilePage() {
  return (
    <section className="section">
      <div className="wrap narrow stack-6">
        <div className="stack-2">
          <p className="meta muted">Player profile</p>
          <h1 className="headline">My player profile</h1>
        </div>
        <ProfileClient />
      </div>
    </section>
  );
}
