/**
 * Local OAuth2 Client Credentials auth
 * Calls POST /oauth/token → stores JWT in sessionStorage
 * Used in local dev instead of SAP IAS OIDC.
 */

const TOKEN_KEY   = 'access_token';
const CUSTOMER_KEY = 'customer_info';

export interface CustomerInfo {
  customerId:  string;
  companyName: string;
  email:       string;
}

export async function loginWithCredentials(
  clientId: string,
  clientSecret: string
): Promise<CustomerInfo> {
  const res = await fetch('/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     clientId,
      client_secret: clientSecret,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? 'Authentication failed');
  }

  sessionStorage.setItem(TOKEN_KEY, data.access_token);
  const info: CustomerInfo = {
    customerId:  data.customer_id,
    companyName: data.company_name,
    email:       '',
  };
  sessionStorage.setItem(CUSTOMER_KEY, JSON.stringify(info));
  return info;
}

export function logout(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(CUSTOMER_KEY);
  window.location.href = '/login';
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getCustomerInfo(): CustomerInfo | null {
  const raw = sessionStorage.getItem(CUSTOMER_KEY);
  return raw ? JSON.parse(raw) : null;
}
