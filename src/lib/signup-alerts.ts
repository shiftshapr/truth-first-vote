import { emailConfigured, emailLayout, sendEmail } from '@/lib/email';
import { newestPlayers, publicStats } from '@/lib/players';
import { FOUNDER_GOAL, escapeHtml, publicBase } from '@/lib/site';

/**
 * Sign-up alerts (owner rule, 2026-11-04): email every X sign-ups, X = max(floor(total / 10), 1).
 * X is taken from the total at the previous email, so the gap grows with the list: every player up to 20,
 * then 22, 24 … 30, 33 … roughly 10% apart (about 10 emails per tenfold growth), plus one at the founder goal.
 * Testing "total % X == 0" instead would fire on every multiple of 10 forever.
 */
export const alertStep = (n: number) => Math.max(Math.floor(n / 10), 1);

function seriesUpTo(n: number): number[] {
  const pts: number[] = [];
  for (let m = 1; m <= n; m += alertStep(m)) pts.push(m);
  return pts;
}

export function isAlertPoint(n: number): boolean {
  if (n <= 0) return false;
  const p = seriesUpTo(n);
  return p[p.length - 1] === n || n === FOUNDER_GOAL;
}

export function prevAlertPoint(n: number): number {
  const p = seriesUpTo(n - 1);
  let prev = p.length ? p[p.length - 1] : 0;
  if (FOUNDER_GOAL < n && FOUNDER_GOAL > prev) prev = FOUNDER_GOAL;
  return prev;
}

export function nextAlertPoint(n: number): number {
  let m = n + 1;
  while (!isAlertPoint(m)) m++;
  return m;
}

function alertRecipients(): string[] {
  return String(process.env.TF_ALERT_TO || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Called after each new player with the running total. Sends only at alert points. */
export async function signupAlert(total: number): Promise<void> {
  if (!isAlertPoint(total)) return;
  const since = prevAlertPoint(total);
  const fresh = await newestPlayers(total - since);
  const stats = await publicStats();
  const label = process.env.TF_ALERT_LABEL || '';
  const subject = `${label}Truth First: ${total} player${total === 1 ? '' : 's'} (+${total - since})`;
  const lines = fresh.map((p) => {
    const bits = [
      `#${p.playerNumber}`,
      p.displayName || p.username || '(no name)',
      p.email || '',
      [p.region, p.country].filter(Boolean).join(', '),
      p.party,
      p.role !== 'player' ? p.role : '',
    ].filter(Boolean);
    return { text: bits.join(' | '), bring: p.bring };
  });
  const top = stats.countries.slice(0, 10).map((c) => `${c.name} ${c.count}`).join(', ') || 'none yet';
  const next = nextAlertPoint(total);
  const head = `${total} people are playing${total < FOUNDER_GOAL ? `, ${FOUNDER_GOAL - total} to go until ${FOUNDER_GOAL}` : ''}.`;
  const text = [
    head, '', `New since the last email (${total - since}):`,
    ...lines.map((l) => `- ${l.text}${l.bring ? `\n    "${l.bring}"` : ''}`),
    '', `By country: ${top}`, '', `Next email at ${next} players.`, `${publicBase()}/admin?tab=players`,
  ].join('\n');
  const to = alertRecipients();
  if (!emailConfigured() || !to.length) {
    console.log(`[signup-alert] not sent (email not configured): ${subject}`);
    return;
  }
  const html = emailLayout(
    `<p>${escapeHtml(head)}</p><p><strong>New since the last email (${total - since}):</strong></p><ul>${lines
      .map((l) => `<li>${escapeHtml(l.text)}${l.bring ? `<br><em>${escapeHtml(l.bring)}</em>` : ''}</li>`)
      .join('')}</ul><p>By country: ${escapeHtml(top)}</p><p>Next email at ${next} players. <a href="${publicBase()}/admin?tab=players">Open the player list</a></p>`,
  );
  for (const addr of to) {
    const r = await sendEmail({ to: addr, subject, html, text });
    if (!r.ok) console.error(`[signup-alert] ${addr}: ${r.error}`);
  }
}
