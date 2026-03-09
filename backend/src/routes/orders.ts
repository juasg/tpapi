import { Router, Request, Response } from 'express';
import { query } from '../snowflake';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All order routes require authentication — customer sees only their own orders
router.use(requireAuth);

// GET /orders
router.get('/', async (req: Request, res: Response) => {
  const customerId = req.customer!.customerId;
  const { status, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  const limit  = Math.min(parseInt(pageSize), 100);
  const offset = (parseInt(page) - 1) * limit;

  let where = 'WHERE CUSTOMER_ID = ?';
  const binds: unknown[] = [customerId];

  if (status) {
    binds.push(status);
    where += ' AND STATUS = ?';
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

  const orders = dataRows.map((r: any) => ({
    id:           r.ORDER_ID,
    orderNumber:  r.ORDER_ID,
    customerId:   r.CUSTOMER_ID,
    createdAt:    r.CREATED_DATE,
    updatedAt:    r.CREATED_DATE,
    totalAmount:  parseFloat(r.TOTAL_AMOUNT),
    currency:     r.CURRENCY,
    deliveryDate: r.DELIVERY_DATE,
    status:       r.STATUS,
    items:        Array.from({ length: Number(r.ITEM_COUNT) }, (_, i) => ({
      productId: '', productName: `Item ${i + 1}`, quantity: 1,
      unitPrice: 0, totalPrice: 0, unit: 'EA',
    })),
  }));

  res.json({ data: orders, total: countRows[0]?.CNT ?? 0, page: parseInt(page), pageSize: limit });
});

// GET /orders/:id
router.get('/:id', async (req: Request, res: Response) => {
  const customerId = req.customer!.customerId;
  const id         = req.params.id;

  const [headerRows, itemRows] = await Promise.all([
    query<any>(
      `SELECT h.VBELN, h.KUNNR, h.ERDAT, h.NETWR, h.WAERK, h.VDATU, h.AUART,
              d.WBSTK, d.VBELN AS DEL_VBELN, f.VBELN AS FLOW_VBELN
       FROM TPAPI_READ.RAW.VBAK h
       LEFT JOIN TPAPI_READ.RAW.VBFA f ON f.VBELV = h.VBELN AND f.VBTYP_N IN ('J','T')
       LEFT JOIN TPAPI_READ.RAW.LIKP d ON d.VBELN = f.VBELN
       WHERE h.VBELN = ? AND h.KUNNR = ?`, [id, customerId]
    ),
    query<any>(
      `SELECT MATNR, ARKTX, KWMENG, VRKME, NETPR, NETWR
       FROM TPAPI_READ.RAW.VBAP WHERE VBELN = ? ORDER BY POSNR`, [id]
    ),
  ]);

  if (!headerRows.length) return res.status(404).json({ message: 'Order not found' });

  const h = headerRows[0];
  const status =
    h.AUART === 'ZCN'    ? 'CANCELLED'   :
    h.WBSTK === 'C'      ? 'DELIVERED'   :
    h.DEL_VBELN          ? 'IN_DELIVERY' :
    h.FLOW_VBELN         ? 'CONFIRMED'   : 'SUBMITTED';

  res.json({
    id:           h.VBELN,
    orderNumber:  h.VBELN,
    customerId:   h.KUNNR,
    createdAt:    h.ERDAT,
    updatedAt:    h.ERDAT,
    totalAmount:  parseFloat(h.NETWR),
    currency:     h.WAERK,
    deliveryDate: h.VDATU,
    status,
    items: itemRows.map((i: any) => ({
      productId:   i.MATNR,
      productName: i.ARKTX,
      quantity:    parseFloat(i.KWMENG),
      unit:        i.VRKME,
      unitPrice:   parseFloat(i.NETPR),
      totalPrice:  parseFloat(i.NETWR),
    })),
  });
});

// GET /orders/:id/status
router.get('/:id/status', async (req: Request, res: Response) => {
  const customerId = req.customer!.customerId;
  const rows = await query<any>(
    `SELECT ORDER_ID, STATUS, UPDATED_AT FROM TPAPI_READ.VIEWS.V_ORDER_STATUS
     WHERE ORDER_ID = ? AND CUSTOMER_ID = ?`,
    [req.params.id, customerId]
  );
  if (!rows.length) return res.status(404).json({ message: 'Order not found' });
  const r = rows[0];
  res.json({ id: r.ORDER_ID, status: r.STATUS, updatedAt: r.UPDATED_AT });
});

// POST /orders — stub (writes go to S/4 via iFlow)
router.post('/', async (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Order creation routes through S/4HANA iFlow — not yet wired in local dev.' });
});

export default router;
