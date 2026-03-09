/**
 * Consolidated Admin Routes — /api/admin/*
 * All endpoints require the x-admin-secret header.
 */
import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth';
import { query } from '../snowflake';
import { listRegistrations } from '../auth/registrationStore';
import { getAdminStats as getKeyStats } from './apikeys';

const router = Router();

router.use(requireAdmin);

// GET /api/admin/stats — aggregate dashboard numbers
router.get('/stats', async (_req: Request, res: Response) => {
  const [customerCount, orderCount] = await Promise.all([
    query<{ CNT: number }>('SELECT COUNT(*) AS CNT FROM TPAPI_READ.RAW.KNA1'),
    query<{ CNT: number }>('SELECT COUNT(*) AS CNT FROM TPAPI_READ.VIEWS.V_ORDER_HISTORY'),
  ]);

  const registrations  = listRegistrations();
  const keyStats       = getKeyStats();

  res.json({
    customers:            customerCount[0]?.CNT ?? 0,
    orders:               orderCount[0]?.CNT    ?? 0,
    pendingRegistrations: registrations.filter((r) => r.status === 'PENDING').length,
    pendingApiKeys:       keyStats.pending,
    activeApiKeys:        keyStats.active,
  });
});

// GET /api/admin/orders — all orders, all customers
router.get('/orders', async (req: Request, res: Response) => {
  const { status, customerId, page = '1', pageSize = '50' } = req.query as Record<string, string>;
  const limit  = Math.min(parseInt(pageSize), 200);
  const offset = (parseInt(page) - 1) * limit;

  let where  = 'WHERE 1=1';
  const binds: unknown[] = [];

  if (status) {
    binds.push(status);
    where += ' AND STATUS = ?';
  }
  if (customerId) {
    binds.push(customerId);
    where += ' AND CUSTOMER_ID = ?';
  }

  const countSql = `SELECT COUNT(*) AS CNT FROM TPAPI_READ.VIEWS.V_ORDER_HISTORY ${where}`;
  const dataSql  = `
    SELECT ORDER_ID, CUSTOMER_ID, CREATED_DATE, TOTAL_AMOUNT, CURRENCY,
           DELIVERY_DATE, ITEM_COUNT, STATUS
    FROM TPAPI_READ.VIEWS.V_ORDER_HISTORY
    ${where}
    ORDER BY CREATED_DATE DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const [countRows, dataRows] = await Promise.all([
    query<{ CNT: number }>(countSql, binds),
    query(dataSql, binds),
  ]);

  const orders = (dataRows as any[]).map((r) => ({
    id:           r.ORDER_ID,
    orderNumber:  r.ORDER_ID,
    customerId:   r.CUSTOMER_ID,
    createdAt:    r.CREATED_DATE,
    totalAmount:  parseFloat(r.TOTAL_AMOUNT),
    currency:     r.CURRENCY,
    deliveryDate: r.DELIVERY_DATE,
    itemCount:    Number(r.ITEM_COUNT),
    status:       r.STATUS,
  }));

  res.json({ data: orders, total: countRows[0]?.CNT ?? 0, page: parseInt(page), pageSize: limit });
});

// GET /api/admin/customers — customer list from Snowflake
router.get('/customers', async (_req: Request, res: Response) => {
  const rows = await query<any>(
    `SELECT KUNNR, NAME1, STRAS, ORT01, LAND1, TELF1, SMTP_ADDR, STCD1
     FROM TPAPI_READ.RAW.KNA1 ORDER BY KUNNR`,
  );
  res.json(rows.map((r: any) => ({
    id:          r.KUNNR,
    companyName: r.NAME1,
    address:     r.STRAS,
    city:        r.ORT01,
    country:     r.LAND1,
    phone:       r.TELF1,
    email:       r.SMTP_ADDR,
    taxId:       r.STCD1,
  })));
});

export default router;
