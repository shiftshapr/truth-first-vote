import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { award } from '@/lib/players';
import { questById } from '@/lib/site';

export type Submission = {
  id: string;
  userId: string;
  questId: string;
  url: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  player?: { name: string; email: string | null; country: string; party: string };
};

function fromRow(r: Record<string, unknown>): Submission {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    questId: String(r.quest_id),
    url: String(r.url || ''),
    body: String(r.body || ''),
    status: r.status as Submission['status'],
    reviewNote: String(r.review_note || ''),
    reviewedBy: r.reviewed_by ? String(r.reviewed_by) : null,
    reviewedAt: r.reviewed_at ? new Date(String(r.reviewed_at)).toISOString() : null,
    createdAt: new Date(String(r.created_at)).toISOString(),
    ...(r.p_country !== undefined
      ? { player: { name: String(r.p_name || r.p_username || 'Unnamed'), email: r.p_email ? String(r.p_email) : null, country: String(r.p_country || ''), party: String(r.p_party || '') } }
      : {}),
  };
}

const bad = (message: string) => Object.assign(new Error(message), { status: 400 });

function validUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error();
    return u.toString().slice(0, 500);
  } catch {
    throw bad('That link does not look right. Paste the full address, starting with https://');
  }
}

/** Hand in a reviewed quest. One open or approved submission per quest per player. */
export async function submitQuest(userId: string, questId: string, input: { url?: unknown; body?: unknown }): Promise<Submission> {
  const quest = questById(questId);
  if (!quest || quest.kind !== 'review') throw bad('That quest is not handed in here.');
  const evidence = 'evidence' in quest ? quest.evidence : 'text';
  const url = evidence.includes('url') ? validUrl(String(input.url || '')) : '';
  const body = String(input.body || '').trim().slice(0, 4000);
  if (evidence.includes('text') && body.length < 40) throw bad('Write a little more: at least a few sentences.');
  const pool = await db();
  const open = await pool.query(
    "SELECT status FROM tf_quest_submission WHERE user_id = $1 AND quest_id = $2 AND status IN ('pending', 'approved') LIMIT 1",
    [userId, questId],
  );
  if (open.rowCount) {
    throw bad(open.rows[0].status === 'approved' ? 'You already completed this quest.' : 'This quest is already waiting for review.');
  }
  const res = await pool.query(
    'INSERT INTO tf_quest_submission (id, user_id, quest_id, url, body) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [randomUUID(), userId, questId, url, body],
  );
  return fromRow(res.rows[0]);
}

export async function mySubmissions(userId: string): Promise<Submission[]> {
  const pool = await db();
  const res = await pool.query('SELECT * FROM tf_quest_submission WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return res.rows.map(fromRow);
}

export async function listSubmissions(status: string | null): Promise<Submission[]> {
  const pool = await db();
  const res = await pool.query(
    `SELECT s.*, p.display_name AS p_name, p.username AS p_username, p.email AS p_email, p.country AS p_country, p.party AS p_party
     FROM tf_quest_submission s JOIN tf_player p ON p.user_id = s.user_id
     WHERE ($1::text IS NULL OR s.status = $1) ORDER BY s.created_at ASC LIMIT 500`,
    [status],
  );
  return res.rows.map(fromRow);
}

/** Approve (awards the quest's points once) or reject a pending submission. */
export async function reviewSubmission(id: string, approve: boolean, note: string, by: string): Promise<Submission> {
  const pool = await db();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cur = await client.query('SELECT * FROM tf_quest_submission WHERE id = $1 FOR UPDATE', [id]);
    if (!cur.rowCount) throw Object.assign(new Error('Submission not found'), { status: 404 });
    if (cur.rows[0].status !== 'pending') throw bad('This submission was already reviewed.');
    const res = await client.query(
      'UPDATE tf_quest_submission SET status = $2, review_note = $3, reviewed_by = $4, reviewed_at = now() WHERE id = $1 RETURNING *',
      [id, approve ? 'approved' : 'rejected', note.slice(0, 1000), by],
    );
    if (approve) {
      const s = res.rows[0];
      await award(client, String(s.user_id), String(s.quest_id), id, questById(String(s.quest_id))?.name || 'Quest', by);
    }
    await client.query('COMMIT');
    return fromRow(res.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
