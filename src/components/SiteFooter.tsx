import Link from 'next/link';
import { ESTATE_LINKS, SITE } from '@/lib/site';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap stack-6">
        <div className="cols">
          <div className="stack-2">
            <p className="title">{SITE.name}</p>
            <p className="small muted">{SITE.tagline}</p>
          </div>
          <div className="stack-2">
            <p className="meta muted">The game</p>
            <ul>
              <li><Link href="/story">The story</Link></li>
              <li><Link href="/play">Play</Link></li>
              <li><Link href="/countries">Play in your country</Link></li>
              <li><Link href="/updates">Updates</Link></li>
              <li><Link href="/support">Support</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
            </ul>
          </div>
          <div className="stack-2">
            <p className="meta muted">Built with</p>
            <ul>
              {ESTATE_LINKS.map((l) => (
                <li key={l.href}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="stack-2 small muted">
          <p>
            <strong>What this is:</strong> Truth First is an imaginary political party and a public game. It isn&apos;t a
            registered party or political committee anywhere, it doesn&apos;t accept contributions, and it doesn&apos;t
            support or oppose any candidate.
          </p>
          <p>
            <strong>Your data:</strong> no trackers and no ads. We keep your player profile and points, we never sell or
            share them, and you can delete them at any time. <Link href="/privacy">How we handle your data</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
}
