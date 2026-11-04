import { randomBytes } from 'crypto';
import type { PoolClient } from 'pg';
import { db } from '@/lib/db';
import { normalizeCountry, isKnownCountry } from '@/lib/countries';
import { ROLE_IDS, questById, type RoleId } from '@/lib/site';
import type { SiteSession } from '@/lib/auth-session';
import { signupAlert } from '@/lib/signup-alerts';

export type Player = {
  userId: string;
  email: string | null;
  displayName: string | null;
  username: string | null;
  country: string;
  region: string;
  party: string;
  role: RoleId;
  bring: string;
  showOnLeaderboard: boolean;
  updatesOptIn: boolean;
  inviteCode: string;
  invitedBy: string | null;
  playerNumber: number | null;
  points: number;
  createdAt: string;
  updatedAt: string;
};

export type PlayerInput = {
  country?: unknown;
  region?: unknown;
  party?: unknown;
  role?: unknown;
  bring?: unknown;
  showOnLeaderboard?: unknown;
  updatesOptIn?: unknown;
  invite?: unknown;
};

const clean = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

function fromRow(row: Record<string, unknown>): Player {
  return {
    userId: String(row.user_id),
    email: row.email ? String(row.email) : null,
    displayName: row.display_name ? String(row.display_name) : null,
    username: row.username ? String(row.username) : null,
    country: String(row.country || ''),
    region: String(row.region || ''),
    party: String(row.party || ''),
    role: (ROLE_IDS as string[]).includes(String(row.role)) ? (row.role as RoleId) : 'player',
    bring: String(row.bring || ''),
    showOnLeaderboard: Boolean(row.show_on_leaderboard),
    updatesOptIn: Boolean(row.updates_opt_in),
    inviteCode: String(row.invite_code),
    invitedBy: row.invited_by ? String(row.invited_by) : null,
    playerNumber: row.player_number == null ? null : Number(row.player_number),
    points: Number(row.points || 0),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

const PLAYER_SELECT = `SELECT p.*, COALESCE((SELECT sum(points) FROM tf_points t WHERE t.user_id = p.user_id), 0) AS points
  FROM tf_player p`;

export async function getPlayer(userId: string): Promise<Player | null> {
  const pool = await db();
  const res = await pool.query(`${PLAYER_SELECT} WHERE p.user_id = $1`, [userId]);
  return res.rows[0] ? fromRow(res.rows[0]) : null;
}

/** Parties count as "different" for the bridge quest when both are filled in and not the same word. */
export function partiesDiffer(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  return Boolean(norm(a) && norm(b) && norm(a) !== norm(b));
}

/** Award points once per (player, quest, ref). Returns true when new points were written. */
export async function award(
  client: PoolClient | Awaited<ReturnType<typeof db>>,
  userId: string,
  questId: string,
  ref: string,
  reason: string,
  awardedBy: string | null = null,
): Promise<boolean> {
  const quest = questById(questId);
  if (!quest) throw new Error(`unknown quest ${questId}`);
  const res = await client.query(
    `INSERT INTO tf_points (user_id, quest_id, points, ref, reason, awarded_by) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, quest_id, ref) DO NOTHING`,
    [userId, questId, quest.points, ref, reason, awardedBy],
  );
  return (res.rowCount || 0) > 0;
}

// Serializes first-time joins so player numbers and the alert schedule see an exact running total.
const JOIN_LOCK = 735123001;

/**
 * Create or update the signed-in person's player profile. The first save makes them a player:
 * a player number, the join points, bridge points for whoever invited them, and maybe a sign-up alert.
 */
export async function upsertPlayer(session: SiteSession, input: PlayerInput): Promise<{ player: Player; created: boolean }> {
  const country = normalizeCountry(input.country);
  if (!country) throw Object.assign(new Error('Which country are you in?'), { status: 400 });
  const role = (ROLE_IDS as string[]).includes(String(input.role)) ? String(input.role) : 'player';
  const fields = {
    country,
    region: clean(input.region, 60),
    party: clean(input.party, 60),
    role,
    bring: clean(input.bring, 1000),
    show: input.showOnLeaderboard === true,
    optIn: input.updatesOptIn !== false,
  };
  const pool = await db();
  const client = await pool.connect();
  let created = false;
  let total = 0;
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [JOIN_LOCK]);
    const existing = await client.query('SELECT user_id FROM tf_player WHERE user_id = $1', [session.userId]);
    if (existing.rowCount) {
      await client.query(
        `UPDATE tf_player SET verifier_id = $2, email = COALESCE($3, email), display_name = $4, username = $5,
           country = $6, region = $7, party = $8, role = $9, bring = $10, show_on_leaderboard = $11,
           updates_opt_in = $12, updated_at = now()
         WHERE user_id = $1`,
        [session.userId, session.verifierId, session.email?.toLowerCase() || null, session.displayName,
          session.username || null, fields.country, fields.region, fields.party, fields.role, fields.bring,
          fields.show, fields.optIn],
      );
    } else {
      created = true;
      const inviteCode = clean(input.invite, 40);
      const inviter = inviteCode
        ? (await client.query('SELECT user_id, party FROM tf_player WHERE invite_code = $1 AND user_id <> $2', [inviteCode, session.userId])).rows[0]
        : undefined;
      const num = Number((await client.query('SELECT COALESCE(max(player_number), 0) + 1 AS n FROM tf_player')).rows[0].n);
      await client.query(
        `INSERT INTO tf_player (user_id, verifier_id, email, display_name, username, country, region, party, role, bring,
           show_on_leaderboard, updates_opt_in, unsubscribe_token, invite_code, invited_by, player_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [session.userId, session.verifierId, session.email?.toLowerCase() || null, session.displayName,
          session.username || null, fields.country, fields.region, fields.party, fields.role, fields.bring,
          fields.show, fields.optIn, randomBytes(24).toString('hex'), randomBytes(6).toString('base64url'),
          inviter?.user_id || null, num],
      );
      await award(client, session.userId, 'join', session.userId, 'Joined the game');
      if (inviter && partiesDiffer(String(inviter.party || ''), fields.party)) {
        await award(client, String(inviter.user_id), 'bridge', session.userId, `Brought in a ${fields.party} player`);
      }
      total = Number((await client.query('SELECT count(*) AS n FROM tf_player')).rows[0].n);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  if (created) signupAlert(total).catch((e) => console.error('[signup-alert]', e));
  const player = await getPlayer(session.userId);
  return { player: player!, created };
}

export async function deletePlayer(userId: string): Promise<void> {
  const pool = await db();
  await pool.query('DELETE FROM tf_player WHERE user_id = $1', [userId]);
}

export async function listPlayers(): Promise<Player[]> {
  const pool = await db();
  const res = await pool.query(`${PLAYER_SELECT} ORDER BY p.created_at DESC`);
  return res.rows.map(fromRow);
}

export async function newestPlayers(n: number): Promise<Player[]> {
  const pool = await db();
  const res = await pool.query(`${PLAYER_SELECT} ORDER BY p.player_number DESC NULLS LAST LIMIT $1`, [n]);
  return res.rows.map(fromRow).reverse();
}

/** Public numbers: how many players, and per known country (free text is grouped as "Other"). */
export async function publicStats(): Promise<{ players: number; countries: { name: string; count: number }[] }> {
  const pool = await db();
  const total = Number((await pool.query('SELECT count(*) AS n FROM tf_player')).rows[0].n);
  const rows = (await pool.query("SELECT country, count(*)::int AS n FROM tf_player WHERE country <> '' GROUP BY country")).rows;
  const map = new Map<string, number>();
  for (const r of rows) {
    const name = isKnownCountry(String(r.country)) ? String(r.country) : 'Other';
    map.set(name, (map.get(name) || 0) + Number(r.n));
  }
  const countries = [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => Number(a.name === 'Other') - Number(b.name === 'Other') || b.count - a.count || a.name.localeCompare(b.name));
  return { players: total, countries };
}

export type LeaderRow = { rank: number; name: string; country: string; points: number; you: boolean };

/** Top players. Names show only for players who chose to; everyone else is "A player from <country>". */
export async function leaderboard(limit: number, viewerId: string | null): Promise<LeaderRow[]> {
  const pool = await db();
  const res = await pool.query(
    `SELECT p.user_id, p.display_name, p.username, p.country, p.show_on_leaderboard, sum(t.points)::int AS points
     FROM tf_player p JOIN tf_points t ON t.user_id = p.user_id
     GROUP BY p.user_id ORDER BY points DESC, min(t.created_at) ASC LIMIT $1`,
    [limit],
  );
  return res.rows.map((r, i) => ({
    rank: i + 1,
    name: r.show_on_leaderboard ? String(r.display_name || r.username || 'A player') : `A player from ${r.country || 'somewhere'}`,
    country: String(r.country || ''),
    points: Number(r.points),
    you: r.user_id === viewerId,
  }));
}

export async function pointsHistory(userId: string): Promise<{ questId: string; points: number; reason: string; at: string }[]> {
  const pool = await db();
  const res = await pool.query('SELECT quest_id, points, reason, created_at FROM tf_points WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return res.rows.map((r) => ({ questId: String(r.quest_id), points: Number(r.points), reason: String(r.reason), at: new Date(r.created_at).toISOString() }));
}

export type AudienceFilter = { countries?: string[]; roles?: string[] };
export type Recipient = { email: string; name: string | null; unsubscribeToken: string };

/** Opted-in players with an email, narrowed by country and role when given (any-of match). */
export async function audienceRecipients(filter: AudienceFilter): Promise<Recipient[]> {
  const countries = (Array.isArray(filter.countries) ? filter.countries : []).map(normalizeCountry).filter(Boolean);
  const roles = (Array.isArray(filter.roles) ? filter.roles : []).filter((r) => (ROLE_IDS as string[]).includes(r));
  const pool = await db();
  const res = await pool.query(
    `SELECT email, display_name, unsubscribe_token FROM tf_player
     WHERE updates_opt_in = true AND email IS NOT NULL AND email <> ''
       AND (cardinality($1::text[]) = 0 OR country = ANY($1::text[]))
       AND (cardinality($2::text[]) = 0 OR role = ANY($2::text[]))
     ORDER BY created_at ASC`,
    [countries, roles],
  );
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const row of res.rows) {
    const email = String(row.email).trim().toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    out.push({ email, name: row.display_name ? String(row.display_name) : null, unsubscribeToken: String(row.unsubscribe_token) });
  }
  return out;
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const t = String(token || '').trim();
  if (!/^[0-9a-f]{48}$/.test(t)) return false;
  const pool = await db();
  const res = await pool.query('UPDATE tf_player SET updates_opt_in = false, updated_at = now() WHERE unsubscribe_token = $1', [t]);
  return (res.rowCount || 0) > 0;
}
