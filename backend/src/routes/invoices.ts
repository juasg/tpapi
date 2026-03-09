import { Router, Request, Response } from 'express';
import { query } from '../snowflake';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const customerId = req.customer!.customerId;
  const { status, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  const limit  = Math.min(parseInt(pageSize), 100);
  const offset = (parseInt(page) - 1) * limit;

  let where = 'WHERE CUSTOMER_ID = ?';
  const binds: unknown[] = [customerId];

  if (status) { binds.push(status); where += ' AND STATUS = ?'; }

  const [countRows, dataRows] = await Promise.all([
    query<{ CNT: number }>(`SELECT COUNT(*) AS CNT FROM TPAPI_READ.VIEWS.V_INVOICE_LIST ${where}`, binds),
    query<any>(`
      SELECT INVOICE_ID, CUSTOMER_ID, ISSUED_DATE, BILLING_DATE, DUE_DATE,
             TOTAL_AMOUNT, CURRENCY, ORDER_ID, STATUS
      FROM TPAPI_READ.VIEWS.V_INVOICE_LIST ${where}
      ORDER BY ISSUED_DATE DESC LIMIT ${limit} OFFSET ${offset}`, binds),
  ]);

  const invoices = dataRows.map((r: any) => ({
    id:            r.INVOICE_ID,
    invoiceNumber: r.INVOICE_ID,
    orderId:       r.ORDER_ID,
    orderNumber:   r.ORDER_ID,
    customerId:    r.CUSTOMER_ID,
    issuedAt:      r.ISSUED_DATE,
    dueDate:       r.DUE_DATE,
    totalAmount:   parseFloat(r.TOTAL_AMOUNT),
    currency:      r.CURRENCY,
    status:        r.STATUS,
  }));

  res.json({ data: invoices, total: countRows[0]?.CNT ?? 0, page: parseInt(page), pageSize: limit });
});

router.get('/:id', async (req: Request, res: Response) => {
  const customerId = req.customer!.customerId;
  const rows = await query<any>(
    `SELECT INVOICE_ID, CUSTOMER_ID, ISSUED_DATE, BILLING_DATE, DUE_DATE,
            TOTAL_AMOUNT, CURRENCY, ORDER_ID, STATUS
     FROM TPAPI_READ.VIEWS.V_INVOICE_LIST WHERE INVOICE_ID = ? AND CUSTOMER_ID = ?`,
    [req.params.id, customerId]
  );
  if (!rows.length) return res.status(404).json({ message: 'Invoice not found' });
  const r = rows[0];
  res.json({
    id:            r.INVOICE_ID,
    invoiceNumber: r.INVOICE_ID,
    orderId:       r.ORDER_ID,
    orderNumber:   r.ORDER_ID,
    customerId:    r.CUSTOMER_ID,
    issuedAt:      r.ISSUED_DATE,
    dueDate:       r.DUE_DATE,
    totalAmount:   parseFloat(r.TOTAL_AMOUNT),
    currency:      r.CURRENCY,
    status:        r.STATUS,
  });
});

export default router;
