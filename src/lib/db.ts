import pg from 'pg';

const { Pool } = pg;

/** Every table is prefixed tf_ so Truth First can share a Postgres instance with the rest of the estate. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS tf_admin_user (
  email TEXT PRIMARY KEY,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by TEXT
);

CREATE TABLE IF NOT EXISTS tf_player (
  user_id TEXT PRIMARY KEY,
  verifier_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  username TEXT,
  country TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  party TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'player',
  bring TEXT NOT NULL DEFAULT '',
  show_on_leaderboard BOOLEAN NOT NULL DEFAULT false,
  updates_opt_in BOOLEAN NOT NULL DEFAULT true,
  unsubscribe_token TEXT NOT NULL UNIQUE,
  invite_code TEXT NOT NULL UNIQUE,
  invited_by TEXT REFERENCES tf_player(user_id) ON DELETE SET NULL,
  player_number INTEGER UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tf_player_created ON tf_player (created_at DESC);

-- A quest a player handed in for review (declare, steelman, source).
CREATE TABLE IF NOT EXISTS tf_quest_submission (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES tf_player(user_id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tf_quest_submission_status ON tf_quest_submission (status, created_at);

-- Every point ever awarded. A player's score is the sum. ref makes an award happen once
-- (join: the player; bridge: the invited player; reviewed quests: the submission).
CREATE TABLE IF NOT EXISTS tf_points (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES tf_player(user_id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  ref TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  awarded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, quest_id, ref)
);

CREATE INDEX IF NOT EXISTS tf_points_user ON tf_points (user_id);

CREATE TABLE IF NOT EXISTS tf_site_message (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  variant TEXT NOT NULL DEFAULT 'info',
  link_url TEXT,
  link_label TEXT,
  audience TEXT NOT NULL DEFAULT 'everyone',
  status TEXT NOT NULL DEFAULT 'draft',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS tf_broadcast (
  id UUID PRIMARY KEY,
  subject TEXT NOT NULL,
  body_md TEXT NOT NULL DEFAULT '',
  html TEXT NOT NULL DEFAULT '',
  audience JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_by TEXT,
  test_mode BOOLEAN NOT NULL DEFAULT false,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  public_archive BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS tf_broadcast_sent ON tf_broadcast (sent_at DESC);

CREATE TABLE IF NOT EXISTS tf_support_ticket (
  id UUID PRIMARY KEY,
  user_id TEXT,
  email TEXT NOT NULL,
  name TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tf_support_ticket_updated ON tf_support_ticket (updated_at DESC);

CREATE TABLE IF NOT EXISTS tf_support_reply (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tf_support_ticket(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author TEXT NOT NULL,
  from_staff BOOLEAN NOT NULL DEFAULT true,
  emailed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tf_support_reply_ticket ON tf_support_reply (ticket_id, created_at);
`;

let pool: pg.Pool | null = null;
let schemaReady: Promise<pg.Pool> | null = null;

export function databaseUrl(): string {
  return String(process.env.TF_DATABASE_URL || process.env.DATABASE_URL || '').trim();
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('TF_DATABASE_URL is not set');
  }
}

/** Pool with the schema applied once per process. */
export function db(): Promise<pg.Pool> {
  const url = databaseUrl();
  if (!url) return Promise.reject(new DatabaseNotConfiguredError());
  if (!pool) {
    pool = new Pool({ connectionString: url, max: 5 });
    // Without a listener, an idle client dropping (Postgres restart) is an uncaught exception.
    pool.on('error', (err) => console.error('[db] idle client error', err));
  }
  if (!schemaReady) {
    const p = pool;
    schemaReady = p
      .query(SCHEMA_SQL)
      .then(() => p)
      .catch((err) => {
        schemaReady = null;
        throw err;
      });
  }
  return schemaReady;
}
