# truthfirst.vote

Landing page for Truth First, an imaginary third party built in public as a game.
One page plus a founding-player sign-up list. At 100 sign-ups we co-create the game on Canopi.

- `node server.js` serves `public/` on 127.0.0.1:3041 (`PORT`, `HOST`, `FOUNDER_GOAL`, `DATA_FILE`).
- `GET /api/count` returns `{count, goal}`; `POST /api/join` appends to `data/signups.jsonl` (mode 600, git-ignored).
- No dependencies, no trackers, no third-party scripts or fonts.

## Staging (box #2)
- PM2 app `truthfirst-staging`, cwd `~/truthfirst-vote-staging`, `PORT=3041`, `DATA_FILE=~/truthfirst-data/staging/signups.jsonl` (outside the checkout).
- nginx: `deploy/staging.truthfirst.vote.conf` (HTTP only until DNS points `staging.truthfirst.vote` at box #2).
- Auto-deploy: `deploy/truthfirst-staging.pull-deploy.conf` (installed as `/etc/pull-deploy/sites/truthfirst-staging.conf`). Merging into `staging` deploys.
