import type { Metadata } from 'next';
import { CountryBars } from '@/components/FounderCounter';
import PlayButton from '@/components/PlayButton';
import { BASELINE, COUNTRY_THRESHOLD } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Play in your country',
  description:
    'Play Truth First in your own country. Every Truth Country puts its own country first and also values every other people. Keep your party, put truth first.',
};

export default function CountriesPage() {
  return (
    <>
      <section className="hero">
        <div className="wrap stack-6">
          <p className="meta muted">Truth Countries</p>
          <h1 className="display-xl">Play the game <em style={{ color: 'var(--focus)' }}>where you live.</em></h1>
          <p className="lead">
            Truth First is global. Every Truth Country puts its own country first and also values every other people.
            Whatever party system you live under, Truth First sits on top of it: keep your party, and put truth first.
          </p>
          <div><PlayButton label="Bring Truth First to my country" /></div>
        </div>
      </section>

      <section className="section hairline">
        <div className="wrap stack-6">
          <h2 className="headline">How a Truth Country starts</h2>
          <div className="grid-3">
            {[
              ['Join from your country', 'Sign in, tell us where you are and how you want to play: as a player, an organizer or a spokesperson.'],
              [`Reach ${COUNTRY_THRESHOLD} players`, 'When a country has enough players, it gets its own space on Canopi to play in.'],
              ["Write your country's platform", "Players write their own country-first platform on top of the shared baseline below, in their own language and on their own terms."],
            ].map(([h, p], i) => (
              <div key={h} className="card stack-2">
                <span className="step-n">{i + 1}</span>
                <h3 className="title">{h}</h3>
                <p className="muted">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section hairline">
        <div className="wrap stack-6">
          <div className="stack-2">
            <h2 className="headline">The shared baseline</h2>
            <p className="muted">Every Truth Country writes its own platform, and every one keeps these.</p>
          </div>
          <div className="grid-2">
            {BASELINE.map((b) => (
              <div key={b.name} className="card pillar stack-2">
                <h3 className="title">{b.name}</h3>
                <p className="muted">{b.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section hairline">
        <div className="wrap narrow stack-4">
          <h2 className="headline">Where players are</h2>
          <p className="small muted">Players by country. We show only counts, never names. ✓ means the country has its own space.</p>
          <CountryBars />
        </div>
      </section>
    </>
  );
}
