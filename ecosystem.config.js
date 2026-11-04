const fs = require('fs');
const path = require('path');

/** Load non-committed secrets from .env.local for PM2 (server only). */
function loadEnvLocal() {
  const file = path.join(__dirname, '.env.local');
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, idx).trim()] = value;
  }
  return env;
}

const local = loadEnvLocal();

/**
 * The estate's shared Resend key, as desirableproperties.org reads it: only RESEND_* lines from the metaweb-book env
 * files on box #1, read here so the key stays in one place and is never copied into this app. .env.local overrides.
 */
function loadResendEnv() {
  const out = {};
  for (const file of ['/home/ubuntu/metaweb-book/.env', '/home/ubuntu/metaweb-book/stripe-server/.env']) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      if (!key.startsWith('RESEND_')) continue;
      if (!out[key]) out[key] = trimmed.slice(idx + 1).trim();
    }
  }
  return out;
}

const resendEnv = loadResendEnv();

// Box #1 runs its Node apps on /opt/node-v20.18.2 (Next 16 needs >= 20.9), whatever node the pm2 daemon has.
const N20 = '/opt/node-v20.18.2/bin/node';

module.exports = {
  apps: [
    {
      name: 'truthfirst',
      cwd: '/home/ubuntu/truthfirst-vote',
      script: 'node_modules/next/dist/bin/next',
      ...(fs.existsSync(N20) ? { interpreter: N20 } : {}),
      // Loopback only: nginx fronts the site with TLS.
      args: 'start -p 3042 -H 127.0.0.1',
      env: {
        NODE_ENV: 'production',
        TF_ENV: 'prod',
        NEXT_DIST_DIR: '.next-prod',
        PORT: '3042',
        GOVHUB_BASE_URL: 'https://interfacehub.net',
        GOVHUB_INTERNAL_BASE_URL: 'http://127.0.0.1:8000',
        CANOPI_API_BASE: local.CANOPI_API_BASE || 'http://127.0.0.1:3002',
        // Same Web3Auth project as desirableproperties.org, so one identity works across the
        // estate and Gov Hub accepts the token. Public, not a secret. truthfirst.vote
        // must be on this project's allowed origins in the Web3Auth dashboard.
        WEB3AUTH_CLIENT_ID_DEVNET: 'BKvRj4akAwrNHHk4UyYCC4zt9KWigdiuosCX5-idVNclsk9hPPQ4_b8grcl0JF4NhT26oLWb3O5K949SVv6lTGk',
        AUTH_SESSION_SECRET: local.AUTH_SESSION_SECRET || '',
        TF_DATABASE_URL: local.TF_DATABASE_URL || '',
        TF_ADMIN_EMAILS: local.TF_ADMIN_EMAILS || 'daveed@bridgit.io',
        // Sending needs truthfirst.vote verified in that Resend account (TF_EMAIL_FROM's domain).
        RESEND_API_KEY: local.RESEND_API_KEY || resendEnv.RESEND_API_KEY || '',
        TF_EMAIL_FROM: local.TF_EMAIL_FROM || 'Truth First <hello@truthfirst.vote>',
        TF_SUPPORT_EMAIL: local.TF_SUPPORT_EMAIL || 'hello@truthfirst.vote',
        // Sign-up alerts (lib/signup-alerts.ts): every X new players, X = max(floor(total/10), 1).
        TF_ALERT_TO: local.TF_ALERT_TO || 'daveed@bridgit.io',
        TF_PUBLIC_BASE: local.TF_PUBLIC_BASE || 'https://truthfirst.vote',
      },
      max_memory_restart: '384M',
    },
  ],
};
