import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap narrow stack-4">
        <p className="meta muted">404</p>
        <h1 className="headline">This thread does not lead anywhere</h1>
        <p><Link href="/">Back to Truth First</Link></p>
      </div>
    </section>
  );
}
