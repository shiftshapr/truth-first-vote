import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { emailLayout, sendEmail, supportInbox } from '@/lib/email';
import { markdownToEmailHtml } from '@/lib/markdown';
import { SITE, SUPPORT_CATEGORIES, escapeHtml, publicBase } from '@/lib/site';

export type TicketStatus = 'open' | 'answered' | 'closed';

export type SupportReply = {
  id: string;
  body: string;
  author: string;
  fromStaff: boolean;
  emailed: boolean;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  userId: string | null;
  email: string;
  name: string | null;
  category: string;
  subject: string;
  body: string;
  pageUrl: string | null;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  replies?: SupportReply[];
};

const STATUSES: TicketStatus[] = ['open', 'answered', 'closed'];

function ticketFromRow(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    email: String(row.email),
    name: row.name ? String(row.name) : null,
    category: String(row.category),
    subject: String(row.subject),
    body: String(row.body),
    pageUrl: row.page_url ? String(row.page_url) : null,
    status: (STATUSES as string[]).includes(String(row.status)) ? (row.status as TicketStatus) : 'open',
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function replyFromRow(row: Record<string, unknown>): SupportReply {
  return {
    id: String(row.id),
    body: String(row.body),
    author: String(row.author),
    fromStaff: Boolean(row.from_staff),
    emailed: Boolean(row.emailed),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export function categoryLabel(id: string): string {
  return SUPPORT_CATEGORIES.find((c) => c.id === id)?.label || 'General question';
}

export async function createTicket(input: {
  userId: string | null;
  email: string;
  name: string | null;
  category: string;
  subject: string;
  body: string;
  pageUrl: string | null;
  /** True when the address came from a signed-in session rather than the form. */
  verifiedEmail: boolean;
}): Promise<SupportTicket> {
  const category = SUPPORT_CATEGORIES.some((c) => c.id === input.category) ? input.category : 'general';
  const pool = await db();
  const res = await pool.query(
    `INSERT INTO tf_support_ticket (id, user_id, email, name, category, subject, body, page_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      randomUUID(),
      input.userId,
      input.email.trim().toLowerCase(),
      input.name?.trim().slice(0, 200) || null,
      category,
      input.subject.trim().slice(0, 200),
      input.body.trim().slice(0, 10000),
      input.pageUrl?.slice(0, 500) || null,
    ],
  );
  const ticket = ticketFromRow(res.rows[0]);
  void notifyNewTicket(ticket, input.verifiedEmail);
  return ticket;
}

async function notifyNewTicket(ticket: SupportTicket, verifiedEmail: boolean) {
  const base = publicBase();
  const fields = [
    ['Category', categoryLabel(ticket.category)],
    ['From', `${ticket.name ? `${ticket.name} ` : ''}<${ticket.email}>`],
    ['Page', ticket.pageUrl || 'not given'],
  ]
    .map(([k, v]) => `<strong>${k}:</strong> ${escapeHtml(v)}`)
    .join('<br>');
  const staffHtml = emailLayout(
    `<p>${fields}</p><p style="white-space:pre-wrap;">${escapeHtml(ticket.body)}</p>
     <p><a href="${base}/admin?tab=support&ticket=${ticket.id}" style="color:#1e4a37;">Open in the admin console</a></p>`,
  );
  await sendEmail({
    to: supportInbox(),
    subject: `[${SITE.short} support] ${ticket.subject}`,
    html: staffHtml,
    replyTo: ticket.email,
  });
  // The form's email field is unverified, so the confirmation never echoes the submitted text:
  // otherwise anyone could use it to send their own message to any address from our domain.
  await sendEmail({
    to: ticket.email,
    subject: `We have your message (ref ${ticket.id.slice(0, 8)})`,
    html: emailLayout(
      `<p>Thanks for writing to the ${escapeHtml(SITE.name)}. We read every message and will reply to this address.</p>
       ${verifiedEmail ? `<p style="color:#545e57;">Subject: ${escapeHtml(ticket.subject)}</p>` : ''}
       <p style="color:#545e57;font-size:14px;">If you did not contact us, you can ignore this email.</p>`,
      `Reference ${ticket.id.slice(0, 8)}`,
    ),
  });
}

export async function listTickets(status?: TicketStatus): Promise<SupportTicket[]> {
  const pool = await db();
  const res = status
    ? await pool.query('SELECT * FROM tf_support_ticket WHERE status = $1 ORDER BY updated_at DESC LIMIT 500', [status])
    : await pool.query('SELECT * FROM tf_support_ticket ORDER BY updated_at DESC LIMIT 500');
  return res.rows.map(ticketFromRow);
}

export async function getTicket(id: string): Promise<SupportTicket | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const pool = await db();
  const t = await pool.query('SELECT * FROM tf_support_ticket WHERE id = $1', [id]);
  if (!t.rows[0]) return null;
  const r = await pool.query('SELECT * FROM tf_support_reply WHERE ticket_id = $1 ORDER BY created_at ASC', [id]);
  return { ...ticketFromRow(t.rows[0]), replies: r.rows.map(replyFromRow) };
}

export async function setTicketStatus(id: string, status: TicketStatus): Promise<boolean> {
  if (!STATUSES.includes(status)) return false;
  const pool = await db();
  const res = await pool.query(
    'UPDATE tf_support_ticket SET status = $2, updated_at = now() WHERE id = $1',
    [id, status],
  );
  return (res.rowCount || 0) > 0;
}

/** Store a staff reply, email it to the requester, and mark the ticket answered. */
export async function replyToTicket(id: string, body: string, author: string) {
  const ticket = await getTicket(id);
  if (!ticket) return { ok: false as const, error: 'Ticket not found' };
  const text = body.trim().slice(0, 10000);
  if (!text) return { ok: false as const, error: 'Reply is empty' };

  const sent = await sendEmail({
    to: ticket.email,
    subject: `Re: ${ticket.subject}`,
    html: emailLayout(
      `${markdownToEmailHtml(text)}
       <p style="color:#545e57;font-size:14px;margin-top:24px;">Reply to this email to continue the conversation.</p>`,
      `Reference ${ticket.id.slice(0, 8)}`,
    ),
    replyTo: supportInbox(),
  });

  const pool = await db();
  await pool.query(
    `INSERT INTO tf_support_reply (id, ticket_id, body, author, from_staff, emailed) VALUES ($1, $2, $3, $4, true, $5)`,
    [randomUUID(), id, text, author, sent.ok],
  );
  await pool.query(`UPDATE tf_support_ticket SET status = 'answered', updated_at = now() WHERE id = $1`, [id]);
  return { ok: true as const, emailed: sent.ok, emailError: sent.ok ? null : sent.error };
}
