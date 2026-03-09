/**
 * E2E — Order-to-Cash (O2C) Happy Path
 *
 * Tests the full B2B flow against a running backend (default: localhost:3001).
 * Uses the seeded demo account "Acme Corp" (0000100001).
 *
 * Run:
 *   npx ts-node tests/e2e-o2c.ts
 *
 * Requirements:
 *   - Backend running: npm run dev
 *   - ADMIN_SECRET env var set (for admin workflow test)
 */

const BASE = process.env.API_BASE ?? 'http://localhost:3001';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'changeme';

let passed = 0;
let failed = 0;

// ── Test harness ──────────────────────────────────────────────────────────────

function assert(condition: boolean, label: string, detail?: unknown): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`, detail ?? '');
    failed++;
  }
}

async function step(name: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n── ${name}`);
  try {
    await fn();
  } catch (err: any) {
    console.error(`  ✗ UNCAUGHT: ${err.message}`);
    failed++;
  }
}

async function api(
  method: string,
  path: string,
  opts: { body?: unknown; token?: string; adminSecret?: string } = {},
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token)       headers['Authorization']  = `Bearer ${opts.token}`;
  if (opts.adminSecret) headers['x-admin-secret'] = opts.adminSecret;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  let body: any;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

// For /oauth/token (application/x-www-form-urlencoded)
async function oauthToken(clientId: string, clientSecret: string) {
  const res = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     clientId,
      client_secret: clientSecret,
    }),
  });
  return { status: res.status, body: await res.json() };
}

// ── Test suite ────────────────────────────────────────────────────────────────

async function main() {
  console.log('TPAPI E2E — O2C Happy Path');
  console.log(`Target: ${BASE}\n`);

  let token = '';
  let orderId = '';
  let regId = '';
  let newClientId = '';
  let newClientSecret = '';

  // ── 1. Health check ────────────────────────────────────────────────────────
  await step('Health check', async () => {
    const { status, body } = await api('GET', '/health');
    assert(status === 200, 'GET /health → 200');
    assert(body?.status === 'ok', 'status === "ok"', body);
  });

  // ── 2. Authentication ──────────────────────────────────────────────────────
  await step('OAuth2 — client credentials', async () => {
    const { status, body } = await oauthToken('0000100001', 'acme-secret-2026!');
    assert(status === 200, 'POST /oauth/token → 200', body);
    assert(typeof body?.access_token === 'string', 'access_token present');
    assert(body?.token_type === 'Bearer', 'token_type === "Bearer"');
    assert(typeof body?.expires_in === 'number', 'expires_in present');
    token = body?.access_token ?? '';
  });

  await step('OAuth2 — invalid credentials rejected', async () => {
    const { status } = await oauthToken('0000100001', 'wrong-secret');
    assert(status === 401, 'invalid credentials → 401');
  });

  await step('OAuth2 — /oauth/me introspect', async () => {
    const { status, body } = await api('GET', '/oauth/me', { token });
    assert(status === 200, 'GET /oauth/me → 200');
    assert(body?.customerId === '0000100001', 'customerId correct', body);
    assert(body?.companyName === 'Acme Corp', 'companyName correct', body);
  });

  // ── 3. Product catalog ─────────────────────────────────────────────────────
  await step('Product catalog', async () => {
    const { status, body } = await api('GET', '/api/products');
    assert(status === 200, 'GET /api/products → 200');
    assert(Array.isArray(body?.data ?? body), 'returns array');
    const products = body?.data ?? body;
    assert(products.length > 0, `at least 1 product returned (got ${products.length})`);
  });

  // ── 4. Browse orders ───────────────────────────────────────────────────────
  await step('Order list', async () => {
    const { status, body } = await api('GET', '/api/orders', { token });
    assert(status === 200, 'GET /api/orders → 200');
    assert(Array.isArray(body?.data ?? body), 'returns array');

    // Grab the first order ID for detail/status/shipment tests
    const orders = body?.data ?? body;
    if (orders.length > 0) orderId = orders[0].id;
  });

  await step('Order detail (unauthenticated → 401)', async () => {
    if (!orderId) { console.log('  – skipped (no orders)'); return; }
    const { status } = await api('GET', `/api/orders/${orderId}`);
    assert(status === 401, 'no token → 401');
  });

  await step('Order detail', async () => {
    if (!orderId) { console.log('  – skipped (no orders)'); return; }
    const { status, body } = await api('GET', `/api/orders/${orderId}`, { token });
    assert(status === 200, `GET /api/orders/${orderId} → 200`);
    assert(body?.id === orderId, 'id matches');
    assert(typeof body?.status === 'string', 'status field present');
  });

  await step('Order status', async () => {
    if (!orderId) { console.log('  – skipped (no orders)'); return; }
    const { status, body } = await api('GET', `/api/orders/${orderId}/status`, { token });
    assert(status === 200, `GET /api/orders/${orderId}/status → 200`);
    assert(typeof body?.status === 'string', 'status field present', body);
  });

  // ── 5. Invoices ────────────────────────────────────────────────────────────
  await step('Invoice list', async () => {
    const { status, body } = await api('GET', '/api/invoices', { token });
    assert(status === 200, 'GET /api/invoices → 200');
    assert(Array.isArray(body?.data ?? body), 'returns array');
  });

  // ── 6. Shipment tracking ───────────────────────────────────────────────────
  await step('Shipment tracking', async () => {
    if (!orderId) { console.log('  – skipped (no orders)'); return; }
    const { status, body } = await api('GET', `/api/shipments/${orderId}`, { token });
    // 200 if shipment exists, 404 if order has no shipment yet — both valid
    assert(
      status === 200 || status === 404,
      `GET /api/shipments/${orderId} → ${status} (200 or 404 both OK)`,
    );
    if (status === 200) {
      assert(typeof body?.status === 'string', 'shipment status present', body);
    }
  });

  // ── 7. Dev portal — API key workflow ──────────────────────────────────────
  await step('API key request (POST)', async () => {
    const { status, body } = await api('POST', '/api/developer/api-keys', {
      token,
      body: { name: 'Test Key', product: 'Order Management', plan: 'basic', useCase: 'E2E test' },
    });
    assert(status === 201, 'POST /api/developer/api-keys → 201', body);
    assert(body?.status === 'PENDING', 'status === PENDING');
    assert(body?.key === null, 'key is null until approved');
  });

  await step('API key list (GET)', async () => {
    const { status, body } = await api('GET', '/api/developer/api-keys', { token });
    assert(status === 200, 'GET /api/developer/api-keys → 200');
    assert(Array.isArray(body), 'returns array');
    assert(body.length >= 1, `at least 1 key (got ${body.length})`);
  });

  await step('Admin: list all API key requests', async () => {
    const { status, body } = await api('GET', '/api/developer/api-keys/admin/all', {
      adminSecret: ADMIN_SECRET,
    });
    assert(status === 200, 'GET /admin/all → 200 (or 403 if ADMIN_SECRET not set)', body);
  });

  // ── 8. Customer onboarding registration workflow ───────────────────────────
  await step('Registration — submit', async () => {
    const { status, body } = await api('POST', '/api/customers/register', {
      body: {
        companyName: 'E2E Test Corp',
        email:       `e2e+${Date.now()}@testcorp.example`,
        phone:       '+1 555 000 9999',
        address:     '1 Test Blvd',
        city:        'San Francisco',
        country:     'US',
        taxId:       'US-E2E-TEST',
      },
    });
    assert(status === 201, 'POST /api/customers/register → 201', body);
    assert(typeof body?.registrationId === 'string', 'registrationId present');
    assert(body?.status === 'PENDING', 'status === PENDING');
    regId = body?.registrationId ?? '';
  });

  await step('Registration — duplicate email rejected', async () => {
    // Use a known seeded email to test the duplicate guard
    const email = `dup-${Date.now()}@testcorp.example`;
    await api('POST', '/api/customers/register', {
      body: { companyName: 'Dup Corp', email, phone: '', address: '', city: '', country: 'US', taxId: '' },
    });
    const { status } = await api('POST', '/api/customers/register', {
      body: { companyName: 'Dup Corp 2', email, phone: '', address: '', city: '', country: 'US', taxId: '' },
    });
    assert(status === 409, 'duplicate pending registration → 409');
  });

  await step('Registration — status check', async () => {
    if (!regId) { console.log('  – skipped'); return; }
    const { status, body } = await api('GET', `/api/customers/register/status/${regId}`);
    assert(status === 200, `GET /register/status/${regId} → 200`);
    assert(body?.status === 'PENDING', 'status === PENDING', body);
  });

  await step('Admin: list registrations', async () => {
    const { status, body } = await api('GET', '/api/customers/admin/registrations', {
      adminSecret: ADMIN_SECRET,
    });
    assert(status === 200, 'GET /admin/registrations → 200', body);
    assert(Array.isArray(body), 'returns array');
  });

  await step('Admin: approve registration', async () => {
    if (!regId) { console.log('  – skipped'); return; }
    const { status, body } = await api(
      'PATCH',
      `/api/customers/admin/registrations/${regId}/approve`,
      { adminSecret: ADMIN_SECRET, body: { note: 'Approved via E2E test' } },
    );
    assert(status === 200, `PATCH /admin/registrations/${regId}/approve → 200`, body);
    assert(body?.registration?.status === 'APPROVED', 'status === APPROVED');
    assert(typeof body?.credentials?.clientId === 'string', 'clientId issued');
    assert(typeof body?.credentials?.clientSecret === 'string', 'clientSecret issued once');
    newClientId     = body?.credentials?.clientId ?? '';
    newClientSecret = body?.credentials?.clientSecret ?? '';
  });

  await step('New customer can authenticate with issued credentials', async () => {
    if (!newClientId || !newClientSecret) { console.log('  – skipped'); return; }
    const { status, body } = await oauthToken(newClientId, newClientSecret);
    assert(status === 200, 'new customer POST /oauth/token → 200', body);
    assert(typeof body?.access_token === 'string', 'access_token present');
  });

  await step('Admin: reject a registration', async () => {
    // Submit another registration then reject it
    const { body: reg } = await api('POST', '/api/customers/register', {
      body: {
        companyName: 'Rejected Corp',
        email:       `rejected-${Date.now()}@testcorp.example`,
        phone: '', address: '', city: '', country: 'US', taxId: '',
      },
    });
    if (!reg?.registrationId) { console.log('  – skipped'); return; }

    const { status, body } = await api(
      'PATCH',
      `/api/customers/admin/registrations/${reg.registrationId}/reject`,
      { adminSecret: ADMIN_SECRET, body: { note: 'Duplicate account suspected' } },
    );
    assert(status === 200, 'PATCH /admin/registrations/:id/reject → 200', body);
    assert(body?.status === 'REJECTED', 'status === REJECTED');
    assert(body?.reviewNote === 'Duplicate account suspected', 'reviewNote set');
  });

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('E2E fatal error:', err);
  process.exit(1);
});
