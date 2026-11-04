import { SITE, escapeHtml, publicBase } from '@/lib/site';

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type SendResult = { ok: true; id?: string } | { ok: false; error: string };

function apiKey() {
  return process.env.RESEND_API_KEY?.trim() || '';
}

export function emailConfigured(): boolean {
  return Boolean(apiKey());
}

export function fromAddress(): string {
  return (
    process.env.TF_EMAIL_FROM?.trim()
    || process.env.RESEND_FROM?.trim()
    || `${SITE.name} <hello@${SITE.domain}>`
  );
}

export function supportInbox(): string {
  return (process.env.TF_SUPPORT_EMAIL?.trim() || SITE.contactEmail).toLowerCase();
}

function payload(mail: OutgoingEmail) {
  return {
    from: fromAddress(),
    to: [mail.to],
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    reply_to: mail.replyTo,
    headers: mail.headers,
  };
}

export async function sendEmail(mail: OutgoingEmail): Promise<SendResult> {
  const key = apiKey();
  if (!key) return { ok: false, error: 'RESEND_API_KEY is not set' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload(mail)),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: String(data?.message || `Resend ${res.status}`) };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'send failed' };
  }
}

/** Resend's batch endpoint takes up to 100 messages per call; results come back in order. */
export async function sendEmailBatch(mails: OutgoingEmail[]): Promise<SendResult[]> {
  const key = apiKey();
  if (!key) return mails.map(() => ({ ok: false as const, error: 'RESEND_API_KEY is not set' }));
  const results: SendResult[] = [];
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100);
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk.map(payload)),
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = String(data?.message || `Resend ${res.status}`);
        chunk.forEach(() => results.push({ ok: false, error }));
        continue;
      }
      const ids: Array<{ id?: string }> = Array.isArray(data?.data) ? data.data : [];
      chunk.forEach((_, j) => results.push({ ok: true, id: ids[j]?.id }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'send failed';
      chunk.forEach(() => results.push({ ok: false, error }));
    }
  }
  return results;
}

/** Shared email frame in Truth First's colours. Body HTML must already be safe. */
export function emailLayout(bodyHtml: string, footerHtml = ''): string {
  const base = publicBase();
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#f7f4ec;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ec;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2dccd;border-radius:12px;">
<tr><td style="background:#14213d;border-radius:12px 12px 0 0;padding:20px 24px;">
<div style="height:8px;width:120px;background:#e9b44c;border-radius:4px;margin-bottom:12px;"></div>
<a href="${base}" style="color:#ffffff;text-decoration:none;font:700 22px/1.2 Helvetica,Arial,sans-serif;">${escapeHtml(SITE.name)}</a>
</td></tr>
<tr><td style="padding:24px;color:#14213d;font:16px/1.6 Helvetica,Arial,sans-serif;">${bodyHtml}</td></tr>
<tr><td style="padding:16px 24px 24px;border-top:1px solid #e2dccd;color:#5b6275;font:13px/1.5 Helvetica,Arial,sans-serif;">
${footerHtml}${footerHtml ? '<br>' : ''}An imaginary global party, built in public as a game. <a href="${base}" style="color:#14213d;">${SITE.domain}</a>
</td></tr>
</table></td></tr></table></body></html>`;
}
