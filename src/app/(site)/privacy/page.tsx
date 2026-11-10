import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What Truth First stores about players, why, who can see it, and how to delete it.',
};

const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;

export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="wrap narrow stack-6 prose">
        <div className="stack-4">
          <p className="meta muted">Privacy</p>
          <h1 className="display-l">What we keep, and why</h1>
          <p className="lead muted">
            Truth First is a game, so we need to know who scored what. That&apos;s all we use your data for. No ads, no
            trackers, and we never sell or share it.
          </p>
        </div>

        <div className="stack-2">
          <h2 className="title">What we store</h2>
          <ul>
            <li><strong>From your sign-in:</strong> your email address, the name on your Google or email account, and an account id.</li>
            <li><strong>From your profile:</strong> your country, your region if you give one, your current party, how you want to play, and what you said you&apos;d bring.</li>
            <li><strong>From playing:</strong> the quests you hand in (links and text), your points, and who invited you.</li>
            <li><strong>If you contact support:</strong> your message and our replies.</li>
            <li><strong>Your choices:</strong> whether your name shows on the leaderboard and whether you get update emails.</li>
          </ul>
        </div>

        <div className="stack-2">
          <h2 className="title">Your party is sensitive</h2>
          <p>
            In many countries, your political views are specially protected data. We ask for your party only so the game
            can work: the bridging quest rewards bringing in someone who votes differently. You can leave it blank. We
            store it because you agree to it when you join, and you can change or remove it at any time on your profile.
          </p>
        </div>

        <div className="stack-2">
          <h2 className="title">Who can see it</h2>
          <ul>
            <li><strong>The public</strong> sees only counts: how many players there are, and how many in each country.</li>
            <li><strong>Other players</strong> see your country and points on the leaderboard. They see your name only if you turned that on.</li>
            <li><strong>The Truth First admins</strong> can see your profile and hand-ins, so they can review quests and answer support.</li>
          </ul>
          <p>
            Sign-in runs through Web3Auth and our own sign-in service. Emails are sent through Resend. Traffic passes
            through Cloudflare. They handle your data only to provide those services.
          </p>
        </div>

        <div className="stack-2">
          <h2 className="title">Deleting it</h2>
          <p>
            You can leave the game at any time from <Link href="/play/profile">your profile</Link>. That deletes your
            profile, your points and your quest hand-ins straight away. Support messages are kept separately; ask at {mail}{' '}
            and we&apos;ll delete those too. Encrypted backup copies are overwritten as backups roll over.
          </p>
        </div>

        <div className="stack-2">
          <h2 className="title">Questions</h2>
          <p>Write to {mail}. You can ask what we hold about you, have it corrected, or have it deleted.</p>
        </div>
      </div>
    </section>
  );
}
