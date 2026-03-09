/**
 * Registration Store
 *
 * Tracks self-service customer registration requests.
 * States: PENDING → APPROVED (credentials issued) | REJECTED
 *
 * Production: persist to a DB table (HANA Cloud / PostgreSQL).
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { addCustomer } from './customerStore';

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Registration {
  id:          string;
  companyName: string;
  email:       string;
  phone:       string;
  address:     string;
  city:        string;
  country:     string;
  taxId:       string;
  status:      RegistrationStatus;
  submittedAt: string;
  reviewedAt:  string | null;
  reviewNote:  string | null;
  // Set on approval — returned once, not stored in plain text
  clientId?:   string;
}

const store: Registration[] = [];

export function listRegistrations(): Registration[] {
  return store.map((r) => ({ ...r }));
}

export function getRegistration(id: string): Registration | undefined {
  return store.find((r) => r.id === id);
}

export async function createRegistration(data: {
  companyName: string;
  email:       string;
  phone:       string;
  address:     string;
  city:        string;
  country:     string;
  taxId:       string;
}): Promise<Registration> {
  // Prevent duplicate pending registrations for same email
  const existing = store.find(
    (r) => r.email === data.email && r.status === 'PENDING',
  );
  if (existing) {
    throw Object.assign(new Error('A pending registration for this email already exists.'), {
      statusCode: 409,
    });
  }

  const reg: Registration = {
    id:          `reg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    ...data,
    status:      'PENDING',
    submittedAt: new Date().toISOString(),
    reviewedAt:  null,
    reviewNote:  null,
  };

  store.push(reg);
  console.log(`[REGISTRATION] New: ${reg.id} — ${reg.companyName} (${reg.email})`);
  return reg;
}

export interface ApprovalResult {
  registration: Registration;
  clientId:     string;
  clientSecret: string; // plain — shown once, then only the hash is kept
}

/**
 * Approve a PENDING registration.
 * Generates OAuth2 client credentials and adds the customer to the credential store.
 */
export async function approveRegistration(
  id: string,
  note?: string,
): Promise<ApprovalResult> {
  const reg = store.find((r) => r.id === id);
  if (!reg) throw Object.assign(new Error('Registration not found.'), { statusCode: 404 });
  if (reg.status !== 'PENDING') {
    throw Object.assign(
      new Error(`Cannot approve a registration in status: ${reg.status}`),
      { statusCode: 400 },
    );
  }

  // Generate a unique KUNNR-style client ID and a strong secret
  const clientId     = `C${Date.now()}`;
  const clientSecret = crypto.randomBytes(24).toString('base64url');
  const hashed       = await bcrypt.hash(clientSecret, 12);

  // Register in the live credential store
  addCustomer({
    clientId,
    clientSecret: hashed,
    companyName:  reg.companyName,
    email:        reg.email,
    country:      reg.country,
  });

  reg.status     = 'APPROVED';
  reg.clientId   = clientId;
  reg.reviewedAt = new Date().toISOString();
  reg.reviewNote = note ?? null;

  console.log(`[REGISTRATION] Approved: ${reg.id} → clientId=${clientId}`);
  return { registration: reg, clientId, clientSecret };
}

export function rejectRegistration(id: string, note?: string): Registration {
  const reg = store.find((r) => r.id === id);
  if (!reg) throw Object.assign(new Error('Registration not found.'), { statusCode: 404 });
  if (reg.status !== 'PENDING') {
    throw Object.assign(
      new Error(`Cannot reject a registration in status: ${reg.status}`),
      { statusCode: 400 },
    );
  }

  reg.status     = 'REJECTED';
  reg.reviewedAt = new Date().toISOString();
  reg.reviewNote = note ?? 'Registration rejected by administrator.';

  console.log(`[REGISTRATION] Rejected: ${reg.id} — ${reg.companyName}`);
  return reg;
}
