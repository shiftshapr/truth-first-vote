import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth-session';
import { isEmail } from '@/lib/site';
import { createTicket } from '@/lib/support';

/** Simple per-process throttle: 5 tickets per IP per 10 minutes. */
const WINDOW_MS = 10 * 60 * 1000;
const recent = new Map<string, number[]>();
function throttled(ip: string) {
  const now = Date.now();
  if (recent.size > 5000) {
    for (const [key, times] of recent) {
      if (!times.some((t) => now - t < WINDOW_MS)) recent.delete(key);
    }
  }
  const hits = (recent.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

/** nginx sets X-Real-IP to $remote_addr; the first X-Forwarded-For entry is client-supplied. */
function clientIp(request: Request) {
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  const xff = (request.headers.get('x-forwarded-for') || '').split(',').map((s) => s.trim()).filter(Boolean);
  return xff[xff.length - 1] || 'local';
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (String(body.website || '').trim()) return NextResponse.json({ ok: true }); // honeypot

  if (throttled(clientIp(request))) {
    return NextResponse.json({ error: 'Too many messages. Try again in a few minutes.' }, { status: 429 });
  }

  const session = await readSession();
  const email = String(session?.email || body.email || '').trim().toLowerCase();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();
  if (!isEmail(email)) return NextResponse.json({ error: 'Enter an email address we can reply to.' }, { status: 400 });
  if (!subject) return NextResponse.json({ error: 'Add a subject.' }, { status: 400 });
  if (message.length < 10) return NextResponse.json({ error: 'Tell us a little more.' }, { status: 400 });

  try {
    const ticket = await createTicket({
      userId: session?.userId || null,
      email,
      name: String(body.name || session?.displayName || '').trim() || null,
      category: String(body.category || 'general'),
      subject,
      body: message,
      pageUrl: String(body.pageUrl || '').trim() || null,
      verifiedEmail: Boolean(session?.email),
    });
    return NextResponse.json({ ok: true, reference: ticket.id.slice(0, 8) });
  } catch (err) {
    console.error('[support]', err);
    return NextResponse.json({ error: 'We could not save your message. Email us instead.' }, { status: 500 });
  }
}
