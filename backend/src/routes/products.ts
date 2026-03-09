import { Router, Request, Response } from 'express';
import { query } from '../snowflake';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { search, category, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  const limit  = Math.min(parseInt(pageSize), 100);
  const offset = (parseInt(page) - 1) * limit;

  let where = 'WHERE AVAILABLE = TRUE';
  const binds: unknown[] = [];

  if (search) {
    binds.push(`%${search.toUpperCase()}%`);
    where += ` AND (UPPER(PRODUCT_NAME) LIKE ? OR UPPER(CATEGORY) LIKE ?)`;
    binds.push(`%${search.toUpperCase()}%`);
  }
  if (category) {
    binds.push(category.toUpperCase());
    where += ` AND UPPER(CATEGORY) = ?`;
  }

  const countSql = `SELECT COUNT(*) AS CNT FROM TPAPI_READ.VIEWS.V_PRODUCT_CATALOG ${where}`;
  const dataSql  = `
    SELECT PRODUCT_ID, PRODUCT_NAME, CATEGORY, BASE_UNIT, PRICE, CURRENCY, AVAILABLE
    FROM TPAPI_READ.VIEWS.V_PRODUCT_CATALOG
    ${where}
    ORDER BY PRODUCT_NAME
    LIMIT ${limit} OFFSET ${offset}
  `;

  const [countRows, dataRows] = await Promise.all([
    query<{ CNT: number }>(countSql, binds),
    query(dataSql, binds),
  ]);

  const products = dataRows.map((r: any) => ({
    id:          r.PRODUCT_ID,
    name:        r.PRODUCT_NAME,
    description: `${r.PRODUCT_NAME} — ${r.CATEGORY}`,
    price:       parseFloat(r.PRICE),
    currency:    r.CURRENCY,
    unit:        r.BASE_UNIT,
    category:    r.CATEGORY,
    available:   r.AVAILABLE,
    minOrderQty: 1,
  }));

  res.json({ data: products, total: countRows[0]?.CNT ?? 0, page: parseInt(page), pageSize: limit });
});

router.get('/:id', async (req: Request, res: Response) => {
  const rows = await query<any>(
    `SELECT PRODUCT_ID, PRODUCT_NAME, CATEGORY, BASE_UNIT, PRICE, CURRENCY, AVAILABLE
     FROM TPAPI_READ.VIEWS.V_PRODUCT_CATALOG WHERE PRODUCT_ID = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Product not found' });
  const r = rows[0];
  res.json({
    id:          r.PRODUCT_ID,
    name:        r.PRODUCT_NAME,
    description: `${r.PRODUCT_NAME} — ${r.CATEGORY}`,
    price:       parseFloat(r.PRICE),
    currency:    r.CURRENCY,
    unit:        r.BASE_UNIT,
    category:    r.CATEGORY,
    available:   r.AVAILABLE,
    minOrderQty: 1,
  });
});

export default router;
