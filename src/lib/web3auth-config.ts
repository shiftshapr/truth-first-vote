/**
 * Web3Auth Sapphire Devnet client ID for this deployment. No default: set
 * WEB3AUTH_CLIENT_ID_DEVNET at runtime (ecosystem.config.js). The same Meta-Layer
 * Web3Auth project as desirableproperties.org works once truthfirst.vote is
 * on its allowed origins, and keeps one identity across the estate.
 */
export function getWeb3AuthClientId(): string {
  const clientId = String(process.env.WEB3AUTH_CLIENT_ID_DEVNET || '').trim();
  if (!clientId) {
    throw new Error('WEB3AUTH_CLIENT_ID_DEVNET is not set. Web3Auth sign-in is disabled until it is set.');
  }
  return clientId;
}

/** Devnet only, matching the rest of the estate. */
export function getWeb3AuthPublicConfig() {
  return {
    clientId: getWeb3AuthClientId(),
    web3AuthNetwork: 'sapphire_devnet',
    googleVerifier: 'web3auth-google-sapphire-devnet',
  };
}

export function getGovHubBaseUrl() {
  return String(process.env.GOVHUB_BASE_URL || 'https://interfacehub.net').replace(/\/$/, '');
}

/** Server-side Gov Hub calls: loopback in production avoids nginx HTML 502 pages. */
export function getGovHubProxyBaseUrl() {
  const explicit = String(process.env.GOVHUB_INTERNAL_BASE_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') return 'http://127.0.0.1:8000';
  return getGovHubBaseUrl();
}
