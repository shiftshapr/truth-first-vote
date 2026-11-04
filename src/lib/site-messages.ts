import { randomUUID } from 'crypto';
import { db } from '@/lib/db';

export type SiteMessageVariant = 'info' | 'live' | 'gathering';
export type SiteMessageStatus = 'draft' | 'live' | 'archived';
export type SiteMessageAudience = 'everyone' | 'signed_in' | 'players';

export type SiteMessage = {
  id: string;
  title: string;
  body: string;
  variant: SiteMessageVariant;
  linkUrl: string | null;
  linkLabel: string | null;
  audience: SiteMessageAudience;
  status: SiteMessageStatus;
  startAt: string | null;
  endAt: string | null;
  updatedAt: string;
};

const VARIANTS: SiteMessageVariant[] = ['info', 'live', 'gathering'];
const STATUSES: SiteMessageStatus[] = ['draft', 'live', 'archived'];
const AUDIENCES: SiteMessageAudience[] = ['everyone', 'signed_in', 'players'];

function oneOf<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return (allowed as string[]).includes(String(value)) ? (value as T) : fallback;
}

function iso(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function safeLink(value: unknown): string | null {
  const v = String(value || '').trim();
  if (!v) return null;
  if (v.startsWith('/') && !v.startsWith('//')) return v.slice(0, 500);
  return /^https:\/\//i.test(v) ? v.slice(0, 500) : null;
}

function fromRow(row: Record<string, unknown>): SiteMessage {
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body || ''),
    variant: oneOf(row.variant, VARIANTS, 'info'),
    linkUrl: row.link_url ? String(row.link_url) : null,
    linkLabel: row.link_label ? String(row.link_label) : null,
    audience: oneOf(row.audience, AUDIENCES, 'everyone'),
    status: oneOf(row.status, STATUSES, 'draft'),
    startAt: iso(row.start_at),
    endAt: iso(row.end_at),
    updatedAt: iso(row.updated_at) || new Date().toISOString(),
  };
}

export type SiteMessageInput = Partial<Omit<SiteMessage, 'id' | 'updatedAt'>>;

function normalize(input: SiteMessageInput) {
  return {
    title: String(input.title || '').trim().slice(0, 140),
    body: String(input.body || '').trim().slice(0, 2000),
    variant: oneOf(input.variant, VARIANTS, 'info'),
    linkUrl: safeLink(input.linkUrl),
    linkLabel: String(input.linkLabel || '').trim().slice(0, 60) || null,
    audience: oneOf(input.audience, AUDIENCES, 'everyone'),
    status: oneOf(input.status, STATUSES, 'draft'),
    startAt: iso(input.startAt),
    endAt: iso(input.endAt),
  };
}

export async function listSiteMessages(): Promise<SiteMessage[]> {
  const pool = await db();
  const res = await pool.query('SELECT * FROM tf_site_message ORDER BY updated_at DESC LIMIT 200');
  return res.rows.map(fromRow);
}

export async function createSiteMessage(input: SiteMessageInput, by: string): Promise<SiteMessage> {
  const m = normalize(input);
  if (!m.title) throw new Error('Title is required');
  const pool = await db();
  const res = await pool.query(
    `INSERT INTO tf_site_message
       (id, title, body, variant, link_url, link_label, audience, status, start_at, end_at, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11) RETURNING *`,
    [randomUUID(), m.title, m.body, m.variant, m.linkUrl, m.linkLabel, m.audience, m.status, m.startAt, m.endAt, by],
  );
  return fromRow(res.rows[0]);
}

export async function updateSiteMessage(id: string, input: SiteMessageInput, by: string): Promise<SiteMessage | null> {
  const m = normalize(input);
  if (!m.title) throw new Error('Title is required');
  const pool = await db();
  const res = await pool.query(
    `UPDATE tf_site_message SET title = $2, body = $3, variant = $4, link_url = $5, link_label = $6,
       audience = $7, status = $8, start_at = $9, end_at = $10, updated_by = $11, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id, m.title, m.body, m.variant, m.linkUrl, m.linkLabel, m.audience, m.status, m.startAt, m.endAt, by],
  );
  return res.rows[0] ? fromRow(res.rows[0]) : null;
}

export async function deleteSiteMessage(id: string): Promise<boolean> {
  const pool = await db();
  const res = await pool.query('DELETE FROM tf_site_message WHERE id = $1', [id]);
  return (res.rowCount || 0) > 0;
}

/** Live messages inside their window, filtered to what this visitor may see. */
export async function activeSiteMessages(viewer: { signedIn: boolean; registered: boolean }): Promise<SiteMessage[]> {
  const pool = await db();
  const res = await pool.query(
    `SELECT * FROM tf_site_message
     WHERE status = 'live'
       AND (start_at IS NULL OR start_at <= now())
       AND (end_at IS NULL OR end_at > now())
     ORDER BY updated_at DESC LIMIT 3`,
  );
  return res.rows.map(fromRow).filter((m) => {
    if (m.audience === 'everyone') return true;
    if (m.audience === 'signed_in') return viewer.signedIn;
    return viewer.registered;
  });
}
