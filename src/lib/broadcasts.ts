import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { emailLayout, sendEmail, sendEmailBatch, type OutgoingEmail } from '@/lib/email';
import { markdownToEmailHtml, markdownToHtml, markdownToText } from '@/lib/markdown';
import { audienceRecipients, type AudienceFilter, type Recipient } from '@/lib/players';
import { escapeHtml, publicBase } from '@/lib/site';

export type BroadcastRecord = {
  id: string;
  subject: string;
  bodyMd: string;
  html: string;
  audience: AudienceFilter;
  sentAt: string;
  sentBy: string | null;
  testMode: boolean;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  publicArchive: boolean;
};

function fromRow(row: Record<string, unknown>): BroadcastRecord {
  return {
    id: String(row.id),
    subject: String(row.subject),
    bodyMd: String(row.body_md || ''),
    html: String(row.html || ''),
    audience: (row.audience as AudienceFilter) || {},
    sentAt: new Date(String(row.sent_at)).toISOString(),
    sentBy: row.sent_by ? String(row.sent_by) : null,
    testMode: Boolean(row.test_mode),
    recipientCount: Number(row.recipient_count || 0),
    successCount: Number(row.success_count || 0),
    failureCount: Number(row.failure_count || 0),
    publicArchive: Boolean(row.public_archive),
  };
}

/** Page with a confirm button: link scanners that prefetch GETs cannot unsubscribe anyone. */
function unsubscribeUrl(token: string) {
  return `${publicBase()}/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** RFC 8058 one-click endpoint: mail clients POST here. */
function oneClickUnsubscribeUrl(token: string) {
  return `${publicBase()}/api/broadcast/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** One recipient's email: shared body plus their own unsubscribe link and one-click header. */
export function buildBroadcastEmail(subject: string, bodyMd: string, recipient: Recipient): OutgoingEmail {
  const url = unsubscribeUrl(recipient.unsubscribeToken);
  const oneClick = oneClickUnsubscribeUrl(recipient.unsubscribeToken);
  const greeting = recipient.name ? `<p>Hi ${escapeHtml(recipient.name.split(' ')[0])},</p>` : '';
  return {
    to: recipient.email,
    subject,
    html: emailLayout(
      `${greeting}${markdownToEmailHtml(bodyMd)}`,
      `You are getting this because you joined Truth First and asked for updates. <a href="${url}" style="color:#14213d;">Unsubscribe</a>.`,
    ),
    text: `${markdownToText(bodyMd)}\n\nUnsubscribe: ${url}`,
    headers: {
      'List-Unsubscribe': `<${oneClick}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

export async function previewAudience(filter: AudienceFilter) {
  const recipients = await audienceRecipients(filter);
  return { count: recipients.length, sample: recipients.slice(0, 10).map((r) => r.email) };
}

export async function sendTestBroadcast(subject: string, bodyMd: string, to: string) {
  const mail = buildBroadcastEmail(`[Test] ${subject}`, bodyMd, {
    email: to,
    name: null,
    unsubscribeToken: '0'.repeat(48),
  });
  const result = await sendEmail(mail);
  await logBroadcast({ subject, bodyMd, audience: {}, sentBy: to, testMode: true, recipientCount: 1,
    successCount: result.ok ? 1 : 0, failureCount: result.ok ? 0 : 1, publicArchive: false });
  return result;
}

export async function sendBroadcast(input: {
  subject: string;
  bodyMd: string;
  audience: AudienceFilter;
  sentBy: string;
  publicArchive: boolean;
}) {
  const recipients = await audienceRecipients(input.audience);
  const results = await sendEmailBatch(recipients.map((r) => buildBroadcastEmail(input.subject, input.bodyMd, r)));
  const successCount = results.filter((r) => r.ok).length;
  const failures = results
    .map((r, i) => (r.ok ? null : { email: recipients[i].email, error: r.error }))
    .filter(Boolean);
  const record = await logBroadcast({
    subject: input.subject,
    bodyMd: input.bodyMd,
    audience: input.audience,
    sentBy: input.sentBy,
    testMode: false,
    recipientCount: recipients.length,
    successCount,
    failureCount: recipients.length - successCount,
    publicArchive: input.publicArchive,
  });
  return { record, failures: failures.slice(0, 50) };
}

async function logBroadcast(input: {
  subject: string;
  bodyMd: string;
  audience: AudienceFilter;
  sentBy: string;
  testMode: boolean;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  publicArchive: boolean;
}): Promise<BroadcastRecord> {
  const pool = await db();
  const res = await pool.query(
    `INSERT INTO tf_broadcast
       (id, subject, body_md, html, audience, sent_by, test_mode, recipient_count, success_count, failure_count, public_archive)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      randomUUID(),
      input.subject,
      input.bodyMd,
      markdownToHtml(input.bodyMd),
      JSON.stringify(input.audience || {}),
      input.sentBy,
      input.testMode,
      input.recipientCount,
      input.successCount,
      input.failureCount,
      input.publicArchive,
    ],
  );
  return fromRow(res.rows[0]);
}

export async function listBroadcasts(): Promise<BroadcastRecord[]> {
  const pool = await db();
  const res = await pool.query('SELECT * FROM tf_broadcast ORDER BY sent_at DESC LIMIT 200');
  return res.rows.map(fromRow);
}

export async function setBroadcastArchive(id: string, publicArchive: boolean): Promise<boolean> {
  const pool = await db();
  const res = await pool.query(
    'UPDATE tf_broadcast SET public_archive = $2 WHERE id = $1 AND test_mode = false',
    [id, publicArchive],
  );
  return (res.rowCount || 0) > 0;
}

export async function listPublicUpdates(): Promise<BroadcastRecord[]> {
  const pool = await db();
  const res = await pool.query(
    'SELECT * FROM tf_broadcast WHERE public_archive = true AND test_mode = false ORDER BY sent_at DESC LIMIT 100',
  );
  return res.rows.map(fromRow);
}

export async function getPublicUpdate(id: string): Promise<BroadcastRecord | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const pool = await db();
  const res = await pool.query(
    'SELECT * FROM tf_broadcast WHERE id = $1 AND public_archive = true AND test_mode = false',
    [id],
  );
  return res.rows[0] ? fromRow(res.rows[0]) : null;
}
