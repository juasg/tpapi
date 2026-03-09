import { Router, Request, Response } from 'express';
import { query } from '../snowflake';
import { requireAdmin } from '../middleware/auth';
import {
  createRegistration,
  approveRegistration,
  rejectRegistration,
  listRegistrations,
  getRegistration,
} from '../auth/registrationStore';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────

// GET /api/customers — list from Snowflake KNA1
router.get('/', async (_req: Request, res: Response) => {
  const rows = await query<any>(
    `SELECT KUNNR, NAME1, STRAS, ORT01, LAND1, TELF1, SMTP_ADDR, STCD1
     FROM TPAPI_READ.RAW.KNA1 ORDER BY KUNNR`,
  );
  const customers = rows.map((r: any) => ({
    id:          r.KUNNR,
    companyName: r.NAME1,
    address:     r.STRAS,
    city:        r.ORT01,
    country:     r.LAND1,
    phone:       r.TELF1,
    email:       r.SMTP_ADDR,
    taxId:       r.STCD1,
  }));
  res.json(customers);
});

// POST /api/customers/register — self-service onboarding
router.post('/register', async (req: Request, res: Response) => {
  const { companyName, email, phone, address, city, country, taxId } = req.body as Record<string, string>;

  if (!companyName || !email) {
    return res.status(400).json({ message: 'companyName and email are required' });
  }

  try {
    const reg = await createRegistration({
      companyName,
      email,
      phone:   phone   ?? '',
      address: address ?? '',
      city:    city    ?? '',
      country: country ?? '',
      taxId:   taxId   ?? '',
    });

    // In production: trigger approval-request email to admin here
    res.status(201).json({
      registrationId: reg.id,
      status:         reg.status,
      message:        `Registration received for ${companyName}. You will receive your API credentials by email once approved.`,
    });
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ message: err.message });
  }
});

// GET /api/customers/register/status/:id — customer checks own registration status
router.get('/register/status/:id', (req: Request, res: Response) => {
  const reg = getRegistration(req.params['id'] as string);
  if (!reg) return res.status(404).json({ message: 'Registration not found' });

  res.json({
    id:          reg.id,
    status:      reg.status,
    submittedAt: reg.submittedAt,
    reviewedAt:  reg.reviewedAt,
    reviewNote:  reg.status === 'REJECTED' ? reg.reviewNote : undefined,
    // Only tell them the clientId was assigned (never the secret again)
    clientId:    reg.status === 'APPROVED' ? reg.clientId : undefined,
  });
});

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /api/customers/admin/registrations — list all registration requests
router.get('/admin/registrations', requireAdmin, (_req: Request, res: Response) => {
  res.json(listRegistrations());
});

// PATCH /api/customers/admin/registrations/:id/approve
router.patch('/admin/registrations/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await approveRegistration(req.params['id'] as string, req.body?.note);
    // Return the plain-text secret ONCE — admin must forward to customer
    res.json({
      registration: result.registration,
      credentials: {
        clientId:     result.clientId,
        clientSecret: result.clientSecret,
        note:         'This is the only time the client secret is shown. Forward it to the customer securely.',
      },
    });
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ message: err.message });
  }
});

// PATCH /api/customers/admin/registrations/:id/reject
router.patch('/admin/registrations/:id/reject', requireAdmin, (req: Request, res: Response) => {
  try {
    const reg = rejectRegistration(req.params['id'] as string, req.body?.note);
    res.json(reg);
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ message: err.message });
  }
});

export default router;
