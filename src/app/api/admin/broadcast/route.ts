import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { listBroadcasts, previewAudience, sendBroadcast, sendTestBroadcast } from '@/lib/broadcasts';
import type { AudienceFilter } from '@/lib/players';

export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ broadcasts: await listBroadcasts() });
}

/**
 * action "audience": count recipients for a filter.
 * action "test": send to the signed-in admin only.
 * action "send": send to everyone matching; requires confirmCount to equal the live count.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  const audience: AudienceFilter = {
    countries: Array.isArray(body.audience?.countries) ? body.audience.countries.map(String) : [],
    roles: Array.isArray(body.audience?.roles) ? body.audience.roles.map(String) : [],
  };
  const action = String(body.action || '');

  if (action === 'audience') return NextResponse.json(await previewAudience(audience));

  const subject = String(body.subject || '').trim().slice(0, 200);
  const bodyMd = String(body.bodyMd || '').trim();
  if (!subject || !bodyMd) return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });

  if (action === 'test') {
    const result = await sendTestBroadcast(subject, bodyMd, auth.email);
    return result.ok
      ? NextResponse.json({ ok: true, to: auth.email })
      : NextResponse.json({ error: result.error }, { status: 502 });
  }

  if (action === 'send') {
    const { count } = await previewAudience(audience);
    if (Number(body.confirmCount) !== count) {
      return NextResponse.json(
        { error: `The audience changed to ${count}. Review and confirm again.`, count },
        { status: 409 },
      );
    }
    if (count === 0) return NextResponse.json({ error: 'Nobody matches this audience.' }, { status: 400 });
    const result = await sendBroadcast({
      subject,
      bodyMd,
      audience,
      sentBy: auth.email,
      publicArchive: Boolean(body.publicArchive),
    });
    return NextResponse.json({ ok: true, ...result });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
