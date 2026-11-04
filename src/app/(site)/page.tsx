import Link from 'next/link';
import FounderCounter from '@/components/FounderCounter';
import PlayButton from '@/components/PlayButton';
import { PILLARS, QUESTS } from '@/lib/site';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="wrap stack-6">
          <p className="meta muted">truthfirst.vote</p>
          <h1 className="display-xl">Now is the moment to turn toward <em style={{ color: 'var(--focus)' }}>the truth.</em></h1>
          <p className="lead">
            We can&apos;t keep swinging back and forth between Democrats and Republicans and expecting a different
            country. Truth First isn&apos;t a replacement for your party. It&apos;s a layer on top of it. Stay a Democrat, a
            Republican or an independent, and be Truth First too. We&apos;re designing it together, out loud, as a game,
            with human and AI spokespeople.
          </p>
          <div className="row">
            <PlayButton label="Sign in to play" />
            <Link href="/countries" className="cs-btn cs-btn--secondary">Play in your country</Link>
          </div>
          <FounderCounter />
        </div>
      </section>

      <section className="section hairline">
        <div className="wrap narrow stack-4 prose">
          <h2 className="headline">Why now</h2>
          <p>
            Until now, we haven&apos;t done a good job of distribution or fairness. People live in luxury and in lack side
            by side. For decades, mass atrocities have gone on in plain view, from Sudan to Gaza.<sup><a href="#n1">1</a></sup>{' '}
            Meanwhile, our own government has grown into something that watches us more and answers to us less.
          </p>
          <p>
            AI changes what&apos;s possible. It can become the most powerful tool for surveillance and control ever built.
            Or it can help us build a society that is much better, safer, more respectful and more protective of each
            person. Which one we get is a choice, and the choice is being made now.
          </p>
          <p>Neither party is going to make that choice for us. People inside both parties who put truth first can.</p>
        </div>
      </section>

      <section className="section hairline">
        <div className="wrap stack-6">
          <div className="stack-4" style={{ maxWidth: 720 }}>
            <h2 className="headline">A layer, not a third team</h2>
            <p>
              A system built around two parties asks for loyalty to one of them. Truth First doesn&apos;t compete for that
              loyalty. It sits on top of how you already think and vote. You can be Truth First and a Democrat, or Truth
              First and a Republican. Together we become the swing vote inside both.
            </p>
          </div>
          <div className="grid-3">
            {[
              ['Keep your party', 'Stay registered where you are. Truth First is an overlay, not a defection.'],
              ['Declare it', "Say publicly that you're Truth First as well. Every declaration makes it easier for the next person."],
              ['Swing both ways', 'Truth First voters in both parties publish the same terms and back whoever meets them, in primaries and in general elections.'],
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
          <div className="stack-4" style={{ maxWidth: 720 }}>
            <h2 className="headline">The starting platform</h2>
            <p>
              Truth First is global. Every Truth Country puts its own country first and also values every other people.
              America is the first Truth Country, in a confederation of interdependence. These pillars are a first draft,
              and the founding players will rewrite them.
            </p>
          </div>
          <div className="grid-2">
            {PILLARS.map((p) => (
              <div key={p.name} className="card pillar stack-2">
                <h3 className="title">{p.name}</h3>
                <p className="muted">{p.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section hairline">
        <div className="wrap stack-4">
          <h2 className="headline">What we&apos;re not</h2>
          <div className="nots">
            <span>Not MAGA</span>
            <span>Not identity politics</span>
            <span>Not a protest vote</span>
            <span>Not a breakaway party</span>
            <span>Not a fundraising list</span>
          </div>
        </div>
      </section>

      <section className="section hairline">
        <div className="wrap stack-6">
          <div className="stack-4" style={{ maxWidth: 720 }}>
            <h2 className="headline">It&apos;s a game. You score by being good at truth.</h2>
            <p>
              You won&apos;t earn points for loyalty or for shouting. You&apos;ll earn them for the skills a truth-first party
              actually needs. Everyone who plays signs in, so we know who to give the points to. These are the Season 0
              quests; when 100 founding players have joined, we&apos;ll write the real rules together on{' '}
              <a href="https://canopi.live">Canopi</a>. We&apos;ll start slowly and grow deliberately, at the pace people
              can take it in.
            </p>
          </div>
          <div className="grid-3">
            {QUESTS.map((q) => (
              <div key={q.id} className="card stack-2">
                <span className="cs-tag">{q.skill} · {q.points} pts</span>
                <h3 className="title">{q.name}</h3>
                <p className="muted small">{q.how}</p>
              </div>
            ))}
          </div>
          <div><PlayButton label="Sign in to play" /></div>
        </div>
      </section>

      <section className="section hairline">
        <div className="wrap narrow stack-2 small muted">
          <h2 className="title" style={{ color: 'var(--ink)' }}>Sources and disagreements</h2>
          <ol>
            <li id="n1">
              <strong>Sudan:</strong> on January 7, 2025, the US Secretary of State determined that the Rapid Support
              Forces and allied militias had committed genocide in Sudan. <strong>Gaza:</strong> in September 2025, the UN
              Independent International Commission of Inquiry on the Occupied Palestinian Territory concluded that Israel
              had committed genocide in Gaza. Israel rejects that finding, and the genocide case South Africa brought
              against Israel at the International Court of Justice has not been decided. We name the disagreement because
              a truth-first party shows its sources and where they&apos;re contested.
            </li>
          </ol>
        </div>
      </section>
    </>
  );
}
