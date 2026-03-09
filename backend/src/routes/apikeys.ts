/**
 * API Key Request Workflow
 *
 * States:  PENDING → APPROVED → ACTIVE
 *                  → REJECTED
 *          ACTIVE  → REVOKED
 *
 * Flow:
 *  1. Customer (authenticated) POSTs /api/developer/api-keys  → PENDING
 *  2. Admin approves via PATCH /admin/api-keys/:id/approve    → ACTIVE (key issued)
 *     or rejects via PATCH /admin/api-keys/:id/reject         → REJECTED
 *  3. Customer can revoke their own active key               → REVOKED
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

interface ApiKey {
  id:             string;
  customerId:     string;
  companyName:    string;
  name:           string;
  product:        string;
  plan:           string;
  useCase:        string;
  status:         'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'REVOKED';
  key:            string | null;   // null until APPROVED
  requestedAt:    string;
  reviewedAt:     string | null;
  reviewNote:     string | null;
  requestsToday:  number;
  requestsLimit:  number;
  lastUsedAt:     string | null;
}

// In-memory store — production: persist to DB
const keyStore: ApiKey[] = [];

function planLimit(plan: string): number {
  const limits: Record<string, number> = {
    basic: 1000, standard: 10000, enterprise: 500000,
  };
  return limits[plan] ?? 1000;
}

// ── Customer routes (require JWT) ──────────────────────────────────────────

// GET /api/developer/api-keys — list own keys
router.get('/', requireAuth, (req: Request, res: Response) => {
  const keys = keyStore
    .filter((k) => k.customerId === req.customer!.customerId)
    .map((k) => ({
      ...k,
      key: k.status === 'ACTIVE' ? k.key : null, // only expose key when ACTIVE
    }));
  res.json(keys);
});

// POST /api/developer/api-keys — request a new key
router.post('/', requireAuth, (req: Request, res: Response) => {
  const { name, product, plan, useCase } = req.body as Record<string, string>;

  if (!name || !product || !plan || !useCase) {
    return res.status(400).json({ message: 'name, product, plan, and useCase are required' });
  }

  // Prevent duplicate pending requests for same product
  const hasPending = keyStore.some(
    (k) => k.customerId === req.customer!.customerId &&
           k.product    === product &&
           k.status     === 'PENDING'
  );
  if (hasPending) {
    return res.status(409).json({
      message: 'You already have a pending request for this API product.',
    });
  }

  const entry: ApiKey = {
    id:            `req_${Date.now()}`,
    customerId:    req.customer!.customerId,
    companyName:   req.customer!.companyName,
    name,
    product,
    plan,
    useCase,
    status:        'PENDING',
    key:           null,
    requestedAt:   new Date().toISOString(),
    reviewedAt:    null,
    reviewNote:    null,
    requestsToday: 0,
    requestsLimit: planLimit(plan),
    lastUsedAt:    null,
  };

  keyStore.push(entry);
  console.log(`[API KEY] New request: ${entry.id} — ${entry.companyName} → ${product} (${plan})`);
  res.status(201).json({ ...entry, key: null });
});

// DELETE /api/developer/api-keys/:id — revoke own key
router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const entry = keyStore.find(
    (k) => k.id === req.params.id && k.customerId === req.customer!.customerId
  );
  if (!entry) return res.status(404).json({ message: 'API key not found' });
  if (entry.status !== 'ACTIVE') {
    return res.status(400).json({ message: 'Only ACTIVE keys can be revoked' });
  }
  entry.status    = 'REVOKED';
  entry.reviewedAt = new Date().toISOString();
  res.status(204).send();
});

// ── Admin routes (require x-admin-secret header) ───────────────────────────

// GET /admin/api-keys — list all pending/all requests
router.get('/admin/all', requireAdmin, (_req: Request, res: Response) => {
  res.json(keyStore);
});

// PATCH /admin/api-keys/:id/approve
router.patch('/admin/:id/approve', requireAdmin, (req: Request, res: Response) => {
  const entry = keyStore.find((k) => k.id === req.params.id);
  if (!entry) return res.status(404).json({ message: 'Request not found' });
  if (entry.status !== 'PENDING') {
    return res.status(400).json({ message: `Cannot approve a key in status: ${entry.status}` });
  }

  entry.status     = 'ACTIVE';
  entry.key        = `tpapi_live_${crypto.randomBytes(24).toString('hex')}`;
  entry.reviewedAt = new Date().toISOString();
  entry.reviewNote = req.body?.note ?? null;

  console.log(`[API KEY] Approved: ${entry.id} — ${entry.companyName}`);
  res.json(entry);
});

// PATCH /admin/api-keys/:id/reject
router.patch('/admin/:id/reject', requireAdmin, (req: Request, res: Response) => {
  const entry = keyStore.find((k) => k.id === req.params.id);
  if (!entry) return res.status(404).json({ message: 'Request not found' });
  if (entry.status !== 'PENDING') {
    return res.status(400).json({ message: `Cannot reject a key in status: ${entry.status}` });
  }

  entry.status     = 'REJECTED';
  entry.reviewedAt = new Date().toISOString();
  entry.reviewNote = req.body?.note ?? 'Request rejected by administrator';

  res.json(entry);
});

export function getAdminStats() {
  return {
    pending: keyStore.filter((k) => k.status === 'PENDING').length,
    active:  keyStore.filter((k) => k.status === 'ACTIVE').length,
    total:   keyStore.length,
  };
}

export default router;
