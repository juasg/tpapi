import { Router, Request, Response } from 'express';
import { query } from '../snowflake';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/:orderId', async (req: Request, res: Response) => {
  const customerId = req.customer!.customerId;

  const rows = await query<any>(
    `SELECT SHIPMENT_ID, ORDER_ID, CUSTOMER_ID, STATUS, CARRIER,
            TRACKING_NUMBER, ESTIMATED_DELIVERY, UPDATED_AT
     FROM TPAPI_READ.VIEWS.V_SHIPMENT_STATUS
     WHERE ORDER_ID = ? AND CUSTOMER_ID = ?`,
    [req.params.orderId, customerId]
  );

  if (!rows.length) return res.status(404).json({ message: 'No shipment found for this order' });

  const r  = rows[0];
  const ts = r.UPDATED_AT ?? new Date().toISOString();

  const events = [];
  if (['IN_TRANSIT', 'DELIVERED'].includes(r.STATUS)) {
    events.push({ timestamp: ts, status: 'PICKED',     location: 'Origin Warehouse', description: 'Package picked and ready for dispatch' });
    events.push({ timestamp: ts, status: 'IN_TRANSIT', location: 'In Transit',       description: 'Package in transit to destination' });
  }
  if (r.STATUS === 'DELIVERED') {
    events.push({ timestamp: ts, status: 'DELIVERED',  location: 'Destination',      description: 'Package delivered successfully' });
  }
  if (!events.length) {
    events.push({ timestamp: ts, status: 'PENDING',    location: 'Origin Warehouse', description: 'Shipment created, awaiting pickup' });
  }

  res.json({
    id:                r.SHIPMENT_ID,
    orderId:           r.ORDER_ID,
    orderNumber:       r.ORDER_ID,
    status:            r.STATUS,
    carrier:           r.CARRIER ?? 'TBD',
    trackingNumber:    r.TRACKING_NUMBER ?? 'TBD',
    estimatedDelivery: r.ESTIMATED_DELIVERY,
    events,
  });
});

export default router;
