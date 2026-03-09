/**
 * SAP Identity Authentication Service (IAS) — OIDC integration
 *
 * IAS acts as the OIDC provider. The React SPA uses the Authorization Code
 * flow with PKCE (recommended for SPAs — no client secret in browser).
 *
 * Environment variables (set in .env.local):
 *   VITE_IAS_TENANT_URL   e.g. https://<tenant>.accounts.ondemand.com
 *   VITE_IAS_CLIENT_ID    OAuth2 application client_id from IAS console
 *   VITE_APP_BASE_URL     e.g. http://localhost:5173 (dev) or https://app.e-lo.com
 */

const IAS_TENANT = import.meta.env.VITE_IAS_TENANT_URL ?? '';
const CLIENT_ID = import.meta.env.VITE_IAS_CLIENT_ID ?? '';
const REDIRECT_URI = `${import.meta.env.VITE_APP_BASE_URL ?? window.location.origin}/auth/callback`;

const SCOPES = 'openid profile email';

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(returnPath = '/'): Promise<void> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();

  sessionStorage.setItem('pkce_verifier', verifier);
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('return_path', returnPath);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${IAS_TENANT}/oauth2/authorize?${params}`;
}

// ─── Callback ─────────────────────────────────────────────────────────────────

export async function handleCallback(): Promise<string> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) throw new Error(`IAS error: ${error} — ${params.get('error_description')}`);
  if (!code) throw new Error('No authorization code in callback');
  if (state !== sessionStorage.getItem('oauth_state')) throw new Error('OAuth state mismatch');

  const verifier = sessionStorage.getItem('pkce_verifier');
  if (!verifier) throw new Error('PKCE verifier missing');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code,
    code_verifier: verifier,
  });

  const res = await fetch(`${IAS_TENANT}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${res.statusText}`);

  const tokens = await res.json();
  sessionStorage.setItem('access_token', tokens.access_token);
  sessionStorage.setItem('id_token', tokens.id_token);

  sessionStorage.removeItem('pkce_verifier');
  sessionStorage.removeItem('oauth_state');

  return sessionStorage.getItem('return_path') ?? '/portal';
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export function logout(): void {
  const idToken = sessionStorage.getItem('id_token');
  sessionStorage.clear();

  const params = new URLSearchParams({
    post_logout_redirect_uri: import.meta.env.VITE_APP_BASE_URL ?? window.location.origin,
  });
  if (idToken) params.set('id_token_hint', idToken);

  window.location.href = `${IAS_TENANT}/oauth2/logout?${params}`;
}

// ─── User info ────────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return sessionStorage.getItem('access_token');
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function getUserFromToken(): { name: string; email: string } | null {
  const idToken = sessionStorage.getItem('id_token');
  if (!idToken) return null;
  try {
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    return { name: payload.name ?? payload.sub, email: payload.email ?? '' };
  } catch {
    return null;
  }
}
