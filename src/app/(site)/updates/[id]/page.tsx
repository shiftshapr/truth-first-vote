import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicUpdate } from '@/lib/broadcasts';

export const dynamic = 'force-dynamic';

export default async function UpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const update = await getPublicUpdate(id).catch(() => null);
  if (!update) notFound();
  return (
    <article className="section">
      <div className="wrap narrow stack-6">
        <div className="stack-4">
          <p className="meta muted">
            <Link href="/updates">Updates</Link> ·{' '}
            {new Date(update.sentAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="headline">{update.subject}</h1>
        </div>
        {/* html was sanitized when the broadcast was stored (lib/markdown.ts) */}
        <div className="prose" dangerouslySetInnerHTML={{ __html: update.html }} />
      </div>
    </article>
  );
}
