/**
 * In-memory customer credential store.
 * Seeded at startup from Snowflake KNA1.
 * Production: replace with a proper DB table (e.g. BTP HANA Cloud or PostgreSQL).
 *
 * Each customer gets:
 *   client_id     = their S/4 KUNNR
 *   client_secret = bcrypt-hashed secret (plain shown once at seed time)
 */
import bcrypt from 'bcryptjs';
import { query } from '../snowflake';

export interface CustomerCredential {
  clientId:     string;   // S/4 KUNNR
  clientSecret: string;   // bcrypt hash
  companyName:  string;
  email:        string;
  country:      string;
}

// Map<clientId, credential>
const store = new Map<string, CustomerCredential>();

// Plain secrets shown at seed — in production: delivered via onboarding email
const SEED_SECRETS: Record<string, string> = {
  '0000100001': 'acme-secret-2026!',
  '0000100002': 'globaltech-secret-2026!',
  '0000100003': 'retailmax-secret-2026!',
  '0000100004': 'skybuild-secret-2026!',
  '0000100005': 'pacrim-secret-2026!',
  '0000100006': 'midwest-secret-2026!',
  '0000100007': 'sunbelt-secret-2026!',
  '0000100008': 'northstar-secret-2026!',
  '0000100009': 'atlantic-secret-2026!',
  '0000100010': 'summit-secret-2026!',
};

export async function seedCustomerStore(): Promise<void> {
  const rows = await query<any>(
    `SELECT KUNNR, NAME1, SMTP_ADDR, LAND1 FROM TPAPI_READ.RAW.KNA1 ORDER BY KUNNR`
  );

  for (const r of rows) {
    const plain  = SEED_SECRETS[r.KUNNR] ?? `${r.KUNNR}-default-secret!`;
    const hashed = await bcrypt.hash(plain, 10);
    store.set(r.KUNNR, {
      clientId:     r.KUNNR,
      clientSecret: hashed,
      companyName:  r.NAME1,
      email:        r.SMTP_ADDR ?? '',
      country:      r.LAND1 ?? 'US',
    });
  }
  console.log(`Customer store seeded: ${store.size} customers`);
}

export async function validateCredentials(
  clientId: string,
  clientSecret: string
): Promise<CustomerCredential | null> {
  const cred = store.get(clientId);
  if (!cred) return null;
  const valid = await bcrypt.compare(clientSecret, cred.clientSecret);
  return valid ? cred : null;
}

export function getCustomer(clientId: string): CustomerCredential | undefined {
  return store.get(clientId);
}

export function listCustomers(): CustomerCredential[] {
  return [...store.values()].map((c) => ({ ...c, clientSecret: '[REDACTED]' }));
}

/** Add a newly approved customer to the live credential store. */
export function addCustomer(cred: CustomerCredential): void {
  if (store.has(cred.clientId)) {
    throw new Error(`Customer ${cred.clientId} already exists in credential store.`);
  }
  store.set(cred.clientId, cred);
  console.log(`[CUSTOMER STORE] Added: ${cred.clientId} — ${cred.companyName}`);
}
