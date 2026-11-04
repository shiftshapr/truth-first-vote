import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { listPlayers } from '@/lib/players';

/** Quote for CSV and defuse spreadsheet formulas in user-supplied text. */
function csvCell(v: unknown) {
  let s = Array.isArray(v) ? v.join(' ') : String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const players = await listPlayers();
  if (new URL(request.url).searchParams.get('format') === 'csv') {
    const cols = ['playerNumber', 'displayName', 'email', 'username', 'country', 'region', 'party', 'role', 'points',
      'updatesOptIn', 'showOnLeaderboard', 'bring', 'createdAt'] as const;
    const rows = [cols.join(','), ...players.map((r) => cols.map((c) => csvCell(r[c])).join(','))];
    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="truth-first-players.csv"',
      },
    });
  }
  return NextResponse.json({ players });
}
