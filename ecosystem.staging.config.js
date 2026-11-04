const fs = require('fs');
const path = require('path');

/** Load non-committed staging secrets from .env.local for PM2 (box #2 only). */
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

// Staging on box #2 (staging.truthfirst.vote). Deployed by pull-deploy from the `staging` branch.
module.exports = {
  apps: [
    {
      name: 'truthfirst-staging',
      cwd: '/home/ubuntu/truthfirst-vote-staging',
      script: 'node_modules/next/dist/bin/next',
      // Loopback only: nginx fronts the site with TLS.
      args: 'start -p 3041 -H 127.0.0.1',
      env: {
        NODE_ENV: 'production',
        TF_ENV: 'staging',
        NEXT_DIST_DIR: '.next-staging',
        PORT: '3041',
        // Gov Hub dev/staging (datatracker-dev on box #2).
        GOVHUB_BASE_URL: 'https://dev.interfacehub.net',
        GOVHUB_INTERNAL_BASE_URL: 'http://127.0.0.1:8001',
        CANOPI_API_BASE: local.CANOPI_API_BASE || 'http://127.0.0.1:3003',
        CANOPI_PUBLIC_API_BASE: 'https://staging.api.canopi.live',
        // Staging Web3Auth project (same as staging.desirableproperties.org). Public, not a secret.
        WEB3AUTH_CLIENT_ID_DEVNET: 'BL4DIH0p1zqK3qT6GfVIL4V7YIuIlo5po89t5CgkyxnhRYAZOHg4Gs3huxO63UFloj9uJ9LRkbD8n8Ha3FhR2a4',
        AUTH_SESSION_SECRET: local.AUTH_SESSION_SECRET || '',
        TF_DATABASE_URL: local.TF_DATABASE_URL || '',
        TF_ADMIN_EMAILS: local.TF_ADMIN_EMAILS || 'daveed@bridgit.io',
        // Blank by default: staging sends no email unless a staging Resend key is set in .env.local.
        RESEND_API_KEY: local.RESEND_API_KEY || '',
        TF_EMAIL_FROM: local.TF_EMAIL_FROM || 'Truth First (staging) <hello@truthfirst.vote>',
        TF_SUPPORT_EMAIL: local.TF_SUPPORT_EMAIL || 'hello@truthfirst.vote',
        // Sign-up alerts (lib/signup-alerts.ts): every X new players, X = max(floor(total/10), 1).
        TF_ALERT_TO: local.TF_ALERT_TO || 'daveed@bridgit.io',
        TF_ALERT_LABEL: '[staging] ',
        TF_PUBLIC_BASE: local.TF_PUBLIC_BASE || 'https://staging.truthfirst.vote',
      },
      max_memory_restart: '384M',
    },
  ],
};
