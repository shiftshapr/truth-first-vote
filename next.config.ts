import type { NextConfig } from 'next';

/** Production builds go to .next-prod so a deploy can build beside the live app and swap. */
function resolveDistDir(): string {
  if (process.env.NEXT_DIST_DIR) return process.env.NEXT_DIST_DIR;
  const env = (process.env.TF_ENV || '').toLowerCase();
  if (env === 'prod' || env === 'production') return '.next-prod';
  return '.next';
}

/** Same CSP as desirableproperties.org: keeps the Web3Auth modal and its iframes working. */
const WEB3AUTH_CSP = [
  "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https: http:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes' https: http: blob: https://unpkg.com https://cdn.jsdelivr.net https://*.web3auth.io https://*.openlogin.com https://*.tor.us https://*.walletconnect.org https://*.walletconnect.com",
  "style-src 'self' 'unsafe-inline' https: http:",
  "frame-src 'self' https: http: blob: https://*.web3auth.io https://*.openlogin.com https://*.tor.us https://*.walletconnect.org https://*.walletconnect.com",
  "connect-src 'self' https: http: wss:",
  "img-src 'self' data: https: http: blob:",
  "font-src 'self' data: https://fonts.gstatic.com https:",
].join('; ');

const nextConfig: NextConfig = {
  distDir: resolveDistDir(),
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'Content-Security-Policy', value: WEB3AUTH_CSP }] }];
  },
};

export default nextConfig;
