import type { Metadata } from 'next';
import Link from 'next/link';
import PlayButton from '@/components/PlayButton';
import { STORY } from '@/lib/story';

export const metadata: Metadata = {
  title: 'The story',
  description: 'The Truth First story in eight short chapters: keep your party, put truth first.',
};

function Line({ text }: { text: string }) {
  return text.startsWith('!') ? <span className="story-key">{text.slice(1)}</span> : <>{text}</>;
}

export default function StoryPage() {
  const total = STORY.length;
  return (
    <div className="story">
      <section className="story-page story-open" aria-labelledby="story-h">
        <div className="wrap story-inner">
          <p className="meta muted">The Truth First story</p>
          <h1 id="story-h" className="display-xl">
            Now is the moment to turn toward <em style={{ color: 'var(--focus)' }}>the truth.</em>
          </h1>
          <p className="lead muted">Eight short chapters. About five minutes.</p>
          <a className="story-next" href={`#${STORY[0].id}`}>Begin: {STORY[0].title} ↓</a>
        </div>
      </section>

      {STORY.map((ch, i) => {
        const next = STORY[i + 1];
        const last = !next;
        return (
          <section key={ch.id} id={ch.id} className={`story-page${last ? ' story-last' : ''}`} aria-labelledby={`${ch.id}-h`}>
            <div className="wrap story-inner">
              <p className="meta story-count">{i + 1} / {total}</p>
              <h2 id={`${ch.id}-h`} className="display-l">
                <a href={`#${ch.id}`} className="story-anchor">{ch.title}</a>
              </h2>
              <div className="story-verse">
                {ch.stanzas.map((stanza, s) => (
                  <p key={s}>
                    {stanza.map((line, l) => (
                      <span key={l} className="story-line"><Line text={line} /></span>
                    ))}
                  </p>
                ))}
              </div>
              {next ? (
                <a className="story-next" href={`#${next.id}`}>Next: {next.title} ↓</a>
              ) : (
                <div className="row">
                  <PlayButton label="Sign in to play" />
                  <Link href="/countries" className="cs-btn cs-btn--secondary">Play in your country</Link>
                  <a href="#story-h" className="story-next">Back to the start ↑</a>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
