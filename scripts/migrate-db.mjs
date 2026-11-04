#!/usr/bin/env node
/**
 * Apply the cs_ schema now instead of on the first request.
 * Usage: TF_DATABASE_URL=postgresql://... node scripts/migrate-db.mjs
 * The SQL is read from src/lib/db.ts so there is one copy of the schema.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = fs.readFileSync(path.join(root, 'src/lib/db.ts'), 'utf8');
const match = source.match(/export const SCHEMA_SQL = `([\s\S]*?)`;/);
if (!match) {
  console.error('SCHEMA_SQL not found in src/lib/db.ts');
  process.exit(1);
}
const url = process.env.TF_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Set TF_DATABASE_URL');
  process.exit(1);
}
const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(match[1]);
const { rows } = await client.query(
  "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'cs\\_%' ORDER BY 1",
);
console.log('cs_ tables:', rows.map((r) => r.table_name).join(', '));
await client.end();
