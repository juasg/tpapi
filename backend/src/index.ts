import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { connect } from './snowflake';
import { seedCustomerStore } from './auth/customerStore';

import authRouter      from './routes/auth';
import productsRouter  from './routes/products';
import ordersRouter    from './routes/orders';
import invoicesRouter  from './routes/invoices';
import shipmentsRouter from './routes/shipments';
import customersRouter from './routes/customers';
import apiKeysRouter   from './routes/apikeys';
import devportalRouter from './routes/devportal';
import adminRouter     from './routes/admin';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001');
const IS_PROD = process.env.NODE_ENV === 'production';

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = IS_PROD
  ? (process.env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, cb) => {
    // allow server-to-server (no origin) and whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'"],
      fontSrc:     ["'self'"],
      objectSrc:   ["'none'"],
      frameSrc:    ["'none'"],
      upgradeInsecureRequests: IS_PROD ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // allow embedding Swagger UI assets
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth endpoint (prevent credential stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' },
});

app.use('/api', apiLimiter);
app.use('/oauth/token', authLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for OAuth2 form-encoded bodies

// ── Root status page ────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>TPAPI Backend</title>
  <style>
    body  { font-family:'Segoe UI',system-ui,sans-serif; background:#0d1117; color:#e6edf3; margin:0; padding:3rem 2rem; }
    h1    { font-size:1.5rem; margin:0 0 .5rem; color:#58a6ff; }
    p     { color:#8b949e; margin:0 0 2rem; }
    h2    { font-size:1rem; color:#8b949e; margin:2rem 0 .5rem; text-transform:uppercase; letter-spacing:.08em; font-size:.75rem; }
    table { border-collapse:collapse; width:100%; max-width:720px; margin-bottom:1.5rem; }
    th    { text-align:left; padding:.5rem .75rem; background:#161b22; color:#8b949e; font-size:.75rem; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #30363d; }
    td    { padding:.625rem .75rem; border-bottom:1px solid #21262d; font-size:.875rem; }
    td:first-child { font-family:monospace; color:#79c0ff; white-space:nowrap; }
    td:nth-child(2) { color:#e3b341; font-size:.8rem; }
    td:last-child   { color:#8b949e; }
    .badge { display:inline-block; background:#1f4a2e; color:#3fb950; padding:.2rem .6rem; border-radius:10px; font-size:.75rem; font-weight:700; margin-left:.5rem; }
    .lock  { color:#f85149; }
    a { color:#58a6ff; }
  </style>
</head>
<body>
  <h1>TPAPI Backend <span class="badge">RUNNING</span></h1>
  <p>Express API · Snowflake connected · localhost:3001</p>

  <h2>Auth</h2>
  <table>
    <thead><tr><th>Endpoint</th><th>Method</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td>POST /oauth/token</td><td>PUBLIC</td><td>OAuth2 Client Credentials → JWT access token</td></tr>
      <tr><td>GET  /oauth/me</td><td>PUBLIC</td><td>Introspect current token</td></tr>
    </tbody>
  </table>

  <h2>Data APIs <span class="lock">(🔒 Bearer JWT required)</span></h2>
  <table>
    <thead><tr><th>Endpoint</th><th>Auth</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td>GET /api/products</td><td>PUBLIC</td><td>Product catalog (Snowflake)</td></tr>
      <tr><td>GET /api/products/:id</td><td>PUBLIC</td><td>Product detail</td></tr>
      <tr><td>GET /api/orders</td><td>🔒 JWT</td><td>Customer's own orders only</td></tr>
      <tr><td>GET /api/orders/:id</td><td>🔒 JWT</td><td>Order detail (customer-scoped)</td></tr>
      <tr><td>GET /api/orders/:id/status</td><td>🔒 JWT</td><td>Live order status</td></tr>
      <tr><td>GET /api/invoices</td><td>🔒 JWT</td><td>Customer's own invoices only</td></tr>
      <tr><td>GET /api/invoices/:id</td><td>🔒 JWT</td><td>Invoice detail (customer-scoped)</td></tr>
      <tr><td>GET /api/shipments/:orderId</td><td>🔒 JWT</td><td>Shipment tracking (customer-scoped)</td></tr>
      <tr><td>GET /api/customers</td><td>PUBLIC</td><td>Customer list (KNA1)</td></tr>
    </tbody>
  </table>

  <h2>API Key Workflow <span class="lock">(🔒 JWT required)</span></h2>
  <table>
    <thead><tr><th>Endpoint</th><th>Auth</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td>GET  /api/developer/api-keys</td><td>🔒 JWT</td><td>List own API key requests</td></tr>
      <tr><td>POST /api/developer/api-keys</td><td>🔒 JWT</td><td>Request new API key (→ PENDING)</td></tr>
      <tr><td>DELETE /api/developer/api-keys/:id</td><td>🔒 JWT</td><td>Revoke own ACTIVE key</td></tr>
      <tr><td>GET  /api/developer/api-keys/admin/all</td><td>🔑 Admin</td><td>List all requests (admin)</td></tr>
      <tr><td>PATCH /api/developer/api-keys/admin/:id/approve</td><td>🔑 Admin</td><td>Approve → ACTIVE + issue key</td></tr>
      <tr><td>PATCH /api/developer/api-keys/admin/:id/reject</td><td>🔑 Admin</td><td>Reject request</td></tr>
    </tbody>
  </table>

  <p>Frontend portal → <a href="http://localhost:5173">http://localhost:5173</a></p>
</body>
</html>`);
});

app.get('/health', (_req, res) => res.json({ status: 'ok', snowflake: 'connected' }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/oauth',              authRouter);
app.use('/api/products',       productsRouter);
app.use('/api/orders',         ordersRouter);
app.use('/api/invoices',       invoicesRouter);
app.use('/api/shipments',      shipmentsRouter);
app.use('/api/customers',      customersRouter);
app.use('/api/developer/api-keys', apiKeysRouter);
app.use('/api/developer',      devportalRouter);
app.use('/api/admin',          adminRouter);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ message: err.message });
});

async function start() {
  console.log('Connecting to Snowflake…');
  await connect();
  console.log('Snowflake connected.');
  console.log('Seeding customer credential store…');
  await seedCustomerStore();
  app.listen(PORT, () => {
    console.log(`TPAPI backend running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
