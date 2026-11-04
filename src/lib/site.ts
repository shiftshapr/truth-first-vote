export const SITE = {
  name: 'Truth First',
  short: 'Truth First',
  domain: 'truthfirst.vote',
  tagline: 'Now is the moment to turn toward the truth.',
  description:
    'Truth First is an imaginary global party, built in public as a game. It sits on top of the party you already belong to: keep your party, put truth first.',
  contactEmail: 'hello@truthfirst.vote',
};

export function publicBase(): string {
  return String(process.env.TF_PUBLIC_BASE || `https://${SITE.domain}`).replace(/\/$/, '');
}

/** Founding players needed before the game rules are co-created on Canopi. */
export const FOUNDER_GOAL = 100;
/** Players a country needs before it gets its own Truth Country space. */
export const COUNTRY_THRESHOLD = 10;

export const PILLARS = [
  { name: 'Truth first', line: 'Every claim we make is sourced, scored and open to challenge, including this page.' },
  { name: 'Against corruption and drift', line: 'Government answers to people, not donors or lobbies. No more agencies, wars and programs that outlive their purpose because nobody is accountable for ending them.' },
  { name: 'Against surveillance', line: 'No mass monitoring of citizens, whether by the state or by platforms. Your life is not a data feed.' },
  { name: 'Against control over individuals', line: 'A government that protects your freedom instead of managing your life.' },
  { name: 'For human nature', line: 'Policy that fits how people actually live: with family, community and the land.' },
  { name: 'AI for the many', line: "Use AI to close the gaps in distribution and fairness that we couldn't close before, and to protect people, not to rank them." },
  { name: 'Country first, humanity whole', line: 'Each Truth Country is strong and sovereign, and none of them looks away when people anywhere are being destroyed.' },
  { name: 'The universal context graph', line: 'The shared map of what people know and have said, with every source, note and connection, is treated as an element: common to everyone and owned by no company. AI companies, including the makers of LLMs and world models, pay to use it, and the money goes to the people who contributed.' },
  { name: 'The layered web', line: "A layer on top of every web page where anyone can see the sources, challenge a claim and coordinate with others, without asking the platform's permission. It's the baseline everything else here is built on." },
] as const;

/** What every Truth Country keeps, whatever else its players write. */
export const BASELINE = [
  { name: 'Truth first', line: 'Claims are sourced, scored and open to challenge. Where sources disagree, we show the disagreement.' },
  { name: 'Country first, humanity whole', line: 'Put your own country first, and never look away when people anywhere are being destroyed.' },
  { name: 'The universal context graph', line: 'What people know and have said is common to everyone. AI companies pay to use it, and the money goes to the people who contributed.' },
  { name: 'The layered web', line: "Anyone can see the sources, challenge a claim and coordinate on top of any web page, without asking the platform's permission." },
  { name: 'Against surveillance and control', line: 'No mass monitoring of people, whether by the state or by platforms.' },
  { name: 'An overlay, not a breakaway', line: 'You keep your party. Truth First players in every party publish the same terms and back whoever meets them.' },
] as const;

export const ROLES = [
  { id: 'player', label: 'As a player' },
  { id: 'organizer', label: 'As an organizer who helps start my country' },
  { id: 'spokesperson', label: 'As a spokesperson for my country' },
] as const;
export type RoleId = (typeof ROLES)[number]['id'];
export const ROLE_IDS = ROLES.map((r) => r.id) as RoleId[];

export const PARTY_SUGGESTIONS = ['Democrat', 'Republican', 'Independent', 'Another party', 'No party', "Don't usually vote"] as const;

/**
 * Season 0 quests, until the founding players write the real rules.
 * auto: awarded by the site. review: a player submits evidence and an admin approves it.
 * repeatable quests can earn points more than once (bridge: once per person you bring in).
 */
export const QUESTS = [
  {
    id: 'join',
    name: 'Join the game',
    points: 10,
    kind: 'auto',
    repeatable: false,
    skill: 'Showing up',
    how: 'Sign in and fill in your player profile: your country, your party (you keep it) and how you want to play.',
  },
  {
    id: 'declare',
    name: 'Declare it',
    points: 25,
    kind: 'review',
    repeatable: false,
    skill: 'Declaring',
    how: "Post on social that you're Truth First, alongside whatever party you're in. Paste the link to your post here.",
    evidence: 'url',
  },
  {
    id: 'bridge',
    name: 'Bring someone who votes differently',
    points: 25,
    kind: 'auto',
    repeatable: true,
    skill: 'Bridging',
    how: 'Share your invite link. You score each time someone joins with it whose party is different from yours.',
  },
  {
    id: 'steelman',
    name: 'Steelman the other side',
    points: 25,
    kind: 'review',
    repeatable: false,
    skill: 'Steelmanning',
    how: "Pick a view you disagree with and write its strongest case, the way someone who holds it would. An admin checks it's fair, not a straw man.",
    evidence: 'text',
  },
  {
    id: 'source',
    name: 'Bring a sourced claim',
    points: 25,
    kind: 'review',
    repeatable: false,
    skill: 'Sourcing',
    how: 'Share one claim that matters to your country, with a link to its strongest source and a note on who disputes it.',
    evidence: 'url+text',
  },
] as const;
export type QuestId = (typeof QUESTS)[number]['id'];
export const QUEST_IDS = QUESTS.map((q) => q.id) as QuestId[];
export const questById = (id: string) => QUESTS.find((q) => q.id === id);

/** Sibling sites, shown in the footer. */
export const ESTATE_LINKS = [
  { label: 'Canopi', href: 'https://canopi.live' },
  { label: 'The Meta-Layer', href: 'https://themetalayer.org' },
  { label: 'Desirable Properties', href: 'https://desirableproperties.org' },
];

export const SUPPORT_CATEGORIES = [
  { id: 'general', label: 'General question' },
  { id: 'account', label: 'Sign-in or my player profile' },
  { id: 'points', label: 'Points or a quest' },
  { id: 'country', label: 'Starting a Truth Country' },
  { id: 'data', label: 'Delete or export my data' },
  { id: 'bug', label: 'Something is broken' },
] as const;

export function isEmail(value: string | null | undefined): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
