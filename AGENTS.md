# Agent notes: truthfirst.vote

<!-- BEGIN:nextjs-agent-rules -->
This is Next.js 16. APIs and conventions differ from older versions: read the relevant guide in
`node_modules/next/dist/docs/` before writing code, and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

- Started from Bridgit-DAO/coordination-summit (2026-11-04). Sign-in is the estate's Web3Auth + Gov Hub flow
  (`src/lib/web3auth-*`, `src/lib/auth-*`, `src/app/api/auth/*`); keep it in step with that app rather than diverging.
  CSS classes keep the `cs-` prefix; colours are Truth First's (`src/app/globals.css`).
- Framing the owner set: an imaginary **global** party and a game; Truth First is an **overlay** on whatever party you
  are in (never "leave your party" or "never join either party"); every Truth Country puts its own country first and
  values every other people; human and AI spokespeople; the layered web and the universal context graph are baseline.
  Not MAGA, not identity politics. The site takes no money and endorses no candidates: ask the owner before changing
  that. Contested claims show their sources and who disputes them.
- Everyone who plays signs in (owner, 2026-11-04): points need an identity.
- Data: Postgres tables prefixed `tf_`, schema in `src/lib/db.ts`. Delete test data only by the exact ids you created.
- Ship by PR into `staging` (box #2 pull-deploys it); only the owner releases `staging` to `main` (box #1).
  Never work in the deploy checkouts (`~/truthfirst-vote-staging`, `~/.pull-deploy-src/`).
