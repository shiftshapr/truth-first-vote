import { NextResponse } from 'next/server';
import { publicStats } from '@/lib/players';
import { COUNTRY_THRESHOLD, FOUNDER_GOAL } from '@/lib/site';

export const dynamic = 'force-dynamic';

/** Public counts only: total players and players per country. Never names. */
export async function GET() {
  try {
    const s = await publicStats();
    return NextResponse.json({ ...s, goal: FOUNDER_GOAL, threshold: COUNTRY_THRESHOLD });
  } catch {
    return NextResponse.json({ players: 0, countries: [], goal: FOUNDER_GOAL, threshold: COUNTRY_THRESHOLD, unavailable: true });
  }
}
