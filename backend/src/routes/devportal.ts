import { Router, Request, Response } from 'express';

const router = Router();

const API_PRODUCTS = [
  {
    id: 'order-management',
    name: 'Order Management',
    description: 'Create and track B2B sales orders end-to-end.',
    version: '1.0',
    specUrl: '/api-specs/orders.yaml',
    endpoints: ['POST /orders', 'GET /orders', 'GET /orders/{id}', 'GET /orders/{id}/status'],
    tags: ['orders'],
    plans: [
      { id: 'basic',      name: 'Basic',      requestsPerDay: 1000,  requestsPerMinute: 10,  price: 'Free' },
      { id: 'standard',   name: 'Standard',   requestsPerDay: 10000, requestsPerMinute: 60,  price: '$99/mo' },
      { id: 'enterprise', name: 'Enterprise', requestsPerDay: 500000,requestsPerMinute: 500, price: 'Custom' },
    ],
  },
  {
    id: 'invoice-management',
    name: 'Invoice Management',
    description: 'Access billing documents from S/4HANA.',
    version: '1.0',
    specUrl: '/api-specs/invoices.yaml',
    endpoints: ['GET /invoices', 'GET /invoices/{id}'],
    tags: ['invoices'],
    plans: [
      { id: 'basic',      name: 'Basic',      requestsPerDay: 1000,  requestsPerMinute: 10,  price: 'Free' },
      { id: 'standard',   name: 'Standard',   requestsPerDay: 10000, requestsPerMinute: 60,  price: '$49/mo' },
    ],
  },
  {
    id: 'shipment-tracking',
    name: 'Shipment Tracking',
    description: 'Real-time delivery tracking from Snowflake.',
    version: '1.0',
    specUrl: '/api-specs/shipments.yaml',
    endpoints: ['GET /shipments/{orderId}'],
    tags: ['shipments'],
    plans: [
      { id: 'basic',    name: 'Basic',    requestsPerDay: 5000,  requestsPerMinute: 30,  price: 'Free' },
      { id: 'standard', name: 'Standard', requestsPerDay: 50000, requestsPerMinute: 200, price: '$29/mo' },
    ],
  },
  {
    id: 'product-catalog',
    name: 'Product Catalog',
    description: 'Browse the active product master.',
    version: '1.0',
    specUrl: '/api-specs/products.yaml',
    endpoints: ['GET /products', 'GET /products/{id}'],
    tags: ['products'],
    plans: [
      { id: 'basic',    name: 'Basic',    requestsPerDay: 10000, requestsPerMinute: 60,  price: 'Free' },
      { id: 'standard', name: 'Standard', requestsPerDay: 100000,requestsPerMinute: 500, price: '$19/mo' },
    ],
  },
  {
    id: 'customer-onboarding',
    name: 'Customer Onboarding',
    description: 'Self-service customer registration into S/4HANA.',
    version: '1.0',
    specUrl: '/api-specs/customers.yaml',
    endpoints: ['POST /customers/register'],
    tags: ['customers'],
    plans: [
      { id: 'standard', name: 'Standard', requestsPerDay: 500, requestsPerMinute: 5, price: 'Free' },
    ],
  },
];

router.get('/products', (_req: Request, res: Response) => {
  res.json(API_PRODUCTS);
});

router.get('/products/:id', (req: Request, res: Response) => {
  const product = API_PRODUCTS.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'API product not found' });
  res.json(product);
});

// API Keys — in-memory stub (production: persisted in DB + IS)
const apiKeys: Record<string, unknown>[] = [];

router.get('/api-keys', (_req: Request, res: Response) => {
  res.json(apiKeys);
});

router.post('/api-keys', (req: Request, res: Response) => {
  const { name, product, plan, useCase } = req.body;
  const newKey = {
    id:             `key_${Date.now()}`,
    name,
    key:            `tpapi_${Buffer.from(`${name}${Date.now()}`).toString('base64').slice(0, 32)}`,
    status:         'ACTIVE',
    product,
    plan,
    useCase,
    createdAt:      new Date().toISOString(),
    requestsToday:  0,
    requestsLimit:  1000,
  };
  apiKeys.push(newKey);
  res.status(201).json(newKey);
});

router.delete('/api-keys/:id', (req: Request, res: Response) => {
  const idx = apiKeys.findIndex((k: any) => k.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Key not found' });
  apiKeys[idx] = { ...apiKeys[idx], status: 'REVOKED' };
  res.status(204).send();
});

export default router;
