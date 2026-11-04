# truthfirst.vote

**Truth First** is an imaginary global party, built in public as a game. It sits on top of the party you already
belong to: keep your party, put truth first. Players sign in, join with a player profile, do quests and earn points.
At 100 founding players the real game rules are co-written on Canopi.

Built on the Coordination Summit code (Meta-Layer estate pattern): Next.js, Web3Auth sign-in verified by Gov Hub,
Postgres, Resend.

## What it does

| Area | Where |
|------|-------|
| Home: why now, the overlay idea, the platform pillars, the Season 0 quests, a founding-player counter | `/` |
| Play in your country: how a Truth Country starts, the shared baseline, players by country (counts only) | `/countries` |
| Sign in with Web3Auth (Google or email), same identity as the rest of the estate. **Required to play.** | header, `/play` |
| The game: join form (country, party, role), points, quests, invite link, leaderboard | `/play` |
| Edit or delete your player profile | `/play/profile` |
| Support form (hello@truthfirst.vote) | `/support` |
| Public archive of broadcasts; unsubscribe | `/updates`, `/unsubscribe` |
| Admin: players (CSV), quest review, email broadcast (by country and role), site banners, support inbox, admins | `/admin` |

### The game (Season 0)

Quests live in `src/lib/site.ts` (`QUESTS`). `auto` quests score by themselves (join; bridge: when someone joins
with your invite link and their party differs from yours). `review` quests (declare, steelman, source) are handed in on
`/play` and approved or rejected in Admin → Quest review. Points are a ledger (`tf_points`, unique per player, quest
and reference), so an award never happens twice. The leaderboard shows a name only if the player opted in.

### Sign-up alerts

The owner gets an email every X new players, X = max(floor(total at the previous email / 10), 1): every player up to
20, then 22, 24 … 30, 33 … (about 10% apart), plus always at 100. `TF_ALERT_TO`, sent through Resend
(`src/lib/signup-alerts.ts`); without a key they are only logged.

## Data

Postgres tables prefixed `tf_` (`src/lib/db.ts`), applied on first use or with `npm run db:migrate`:
`tf_player`, `tf_points`, `tf_quest_submission`, `tf_admin_user`, `tf_site_message`, `tf_broadcast`,
`tf_support_ticket`, `tf_support_reply`.

## Develop

```bash
cp .env.example .env.local   # TF_DATABASE_URL and AUTH_SESSION_SECRET at least
npm install
npm run dev
```

## Deploy

Merging is deploying, through `pull-deploy`:

- **Staging, box #2:** feature PRs merge into `staging`; box #2 builds beside the live app, swaps it in and restarts
  pm2 `truthfirst-staging` (port 3041, `ecosystem.staging.config.js`). Config: `deploy/truthfirst-staging.pull-deploy.conf`,
  nginx: `nginx/staging.truthfirst.vote.conf`.
- **Production, box #1:** not set up yet (pm2 `truthfirst`, port 3042, `ecosystem.config.js`).
