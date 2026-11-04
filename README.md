# truthfirst.vote

Landing page for Truth First, an imaginary third party built in public as a game.
One page plus a founding-player sign-up list. At 100 sign-ups we co-create the game on Canopi.

- `node server.js` serves `public/` on 127.0.0.1:3041 (`PORT`, `HOST`, `FOUNDER_GOAL`, `DATA_FILE`).
- `GET /api/count` returns `{count, goal}`; `POST /api/join` appends to `data/signups.jsonl` (mode 600, git-ignored).
- No dependencies, no trackers, no third-party scripts or fonts.

## Staging (box #2)
- PM2 app `truthfirst-staging`, cwd `~/truthfirst-vote-staging`, `PORT=3041`, `DATA_FILE=~/truthfirst-data/staging/signups.jsonl` (outside the checkout).
- nginx: `deploy/staging.truthfirst.vote.conf`, HTTPS behind Cloudflare (proxied, Full (strict)) with a Cloudflare Origin CA cert whose key is on box #2.
- Auto-deploy: `deploy/truthfirst-staging.pull-deploy.conf` (installed as `/etc/pull-deploy/sites/truthfirst-staging.conf`). Merging into `staging` deploys.

## Sign-up alerts
Email every X sign-ups, X = max(floor(total at the previous email / 10), 1): every sign-up up to 20, then 22, 24 … 30, 33 …
(roughly 10% apart), plus always at the founder goal (100). Sent through Resend when `RESEND_API_KEY`, `NOTIFY_TO` and
`NOTIFY_FROM` are set (optional `NOTIFY_LABEL` subject prefix, e.g. `[staging] `); otherwise the server only logs them.
The email lists the new sign-ups since the previous email and the counts by country.
