# CLAUDE.md — TPAPI B2B Customer Portal & API Platform

## Context

TPAPI is a greenfield B2B SaaS platform that enables enterprise customers to automate order-to-cash (O2C) transactions — order placement, invoicing, and fulfillment — without requiring a sales rep. It also exposes a self-service developer portal where customers can browse APIs, register, request API keys, and test integrations directly. The platform is hosted on SAP BTP and uses S/4HANA as the transactional backend, SAP Integration Suite as middleware and API management layer, and Snowflake as the read/analytics data store (replicated in near-real-time from S/4).

---

## Architecture Overview

```
[Customer Browser]
        |
        v
[React SPA — BTP (Kyma / Cloud Foundry)]
  - E-commerce / Order Portal
  - API Developer Portal (self-service)
        |
        v
[SAP Integration Suite — API Management]
  - API Gateway (proxies, policies, rate limits)
  - OAuth2 + API Key security
  - API Catalog / Developer Portal (IS built-in + custom React overlay)
        |
        +--------------------------+
        |                          |
        v                          v
[Integration Suite iFlows]   [Integration Suite iFlows]
  (Transactional — writes)     (Read/Analytics — reads)
        |                          |
        v                          v
[S/4HANA — ERP Backend]       [Snowflake — Read Layer]
  - Sales Orders                - Order status
  - Customer Master             - Shipment tracking
  - Invoices                    - Order history
  - Deliveries                  - Product catalog
                                - Analytics

[Replication Layer]
  S/4 → Snowflake via SAP Datasphere (near-real-time CDC)
```

---

## Platform Components

### 1. Frontend — React SPA on BTP

**Location:** `/tpapi/frontend/`

Two integrated portals in one React app (tab/route-based split):

**E-commerce / Order Portal (`/portal/*`):**
- Customer login (SAP IAS — Identity Authentication Service)
- Age verification gate (localStorage-persisted, blocks `/portal/*` for under-18)
- Self-service registration + onboarding wizard
- Product catalog (browsable, searchable) — images from Unsplash/picsum by category
- Order placement form
- Order history & status tracking
- Invoice list & download
- Shipment/delivery tracking

**API Developer Portal (`/devportal/*`):**
- API catalog (browse available APIs with OpenAPI specs)
- Self-service API key request & management dashboard
- API playground (Swagger UI / Redoc embedded, wired to live sandbox)
- Onboarding guide / quickstart docs
- Usage metrics per API key

**Admin Portal (`/admin/*`):**
- Unlock gate (x-admin-secret stored in sessionStorage)
- Dashboard — live stats: customers, orders, pending registrations, API key counts
- Customers — Snowflake KNA1 list + self-service registration approvals/rejections
- Orders — all orders across all customers with status/customer filters
- API Keys — approve/reject customer API key requests, view issued keys

**Tech stack:**
- React 18 + TypeScript
- React Router v6 (route-based code splitting)
- Tanstack Query (data fetching + caching)
- SAP UI5 Web Components for React (enterprise design system)
- Vite (build tool)
- Hosted on BTP — Cloud Foundry static buildpack or Kyma nginx pod

---

### 2. API Management — SAP Integration Suite

**Purpose:** All external API traffic routes through Integration Suite API Management.

**Policies applied per API:**
- OAuth2 / API Key authentication
- Rate limiting (per key, per plan tier)
- Request/response transformation
- CORS
- IP allowlisting (optional for enterprise customers)
- Logging to SAP Cloud Logging

**API Products defined:**
| Product | APIs included |
|---|---|
| Order Management | POST /orders, GET /orders, GET /orders/{id} |
| Invoice Management | GET /invoices, GET /invoices/{id} |
| Shipment Tracking | GET /shipments/{orderId} |
| Product Catalog | GET /products, GET /products/{id} |
| Customer Onboarding | POST /customers/register |

**Developer Portal:**
- SAP Integration Suite built-in developer portal (serves OpenAPI specs)
- Custom React overlay for branding + API key self-service

---

### 3. Integration Flows (iFlows) — SAP Integration Suite

**Location:** Integration Suite tenant, iFlow packages

#### Transactional iFlows (→ S/4HANA)

| iFlow | Trigger | S/4 API Used |
|---|---|---|
| Create Sales Order | POST /orders | OData: A_SalesOrder |
| Get Invoice | GET /invoices/{id} | OData: A_BillingDocument |
| Register Customer | POST /customers/register | BAPI: BAPI_CUSTOMER_CREATEFROMDATA |
| Get Order Details | GET /orders/{id} | OData: A_SalesOrder (fallback if Snowflake stale) |

#### Read iFlows (→ Snowflake)

| iFlow | Trigger | Snowflake Object |
|---|---|---|
| Get Order Status | GET /orders/{id}/status | VIEW: V_ORDER_STATUS |
| Get Order History | GET /orders | VIEW: V_ORDER_HISTORY |
| Get Shipment Status | GET /shipments/{orderId} | VIEW: V_SHIPMENT_STATUS |
| Get Product Catalog | GET /products | VIEW: V_PRODUCT_CATALOG |

**Snowflake connector:** SAP Integration Suite JDBC adapter or custom REST microservice (Snowflake JDBC on Kyma) acting as a data API layer.

---

### 4. S/4HANA — Transactional Backend

All write operations and fallback reads go to S/4.

**APIs consumed (standard S/4 OData v4 / BAPI):**
- `API_SALES_ORDER_SRV` — create/read sales orders
- `API_BILLING_DOCUMENT_SRV` — read invoices
- `API_BUSINESS_PARTNER` — customer master (registration)
- `API_DELIVERY_SRV` — delivery/shipment data
- `API_PRODUCT_SRV` — product master

**Connectivity:** SAP Cloud Connector → BTP Connectivity Service → Integration Suite

---

### 5. Snowflake — Read / Analytics Layer

**Purpose:** Offload all read-heavy and analytics queries from S/4.

**Schema:** `TPAPI_READ` database

**Views exposed:**
- `V_ORDER_STATUS` — current order status per customer
- `V_ORDER_HISTORY` — full order history (customer-scoped)
- `V_SHIPMENT_STATUS` — delivery tracking per order
- `V_PRODUCT_CATALOG` — active product master
- `V_INVOICE_LIST` — invoice list per customer

**Access pattern:** Integration Suite iFlows connect via Snowflake JDBC adapter (or a thin BTP microservice acting as Snowflake REST proxy).

---

### 6. Replication — S/4 → Snowflake

**Tool:** SAP Datasphere (BTP-native, recommended) or SAP Landscape Transformation Replication Server (SLT).

**Method:** CDC (Change Data Capture) — near-real-time table replication from S/4 to Snowflake via Datasphere.

**Tables replicated:**
- `VBAK` / `VBAP` — Sales order header/items
- `VBFA` — Sales document flow
- `LIKP` / `LIPS` — Delivery header/items
- `VBRK` / `VBRP` — Billing document header/items
- `MARA` / `MVKE` — Material master / sales views
- `KNA1` / `KNVV` — Customer master / sales area

---

### 7. Identity & Security

**Customer Identity:** SAP Identity Authentication Service (IAS)
- Social login or email/password
- MFA support
- Self-service registration flows

**User Provisioning:** SAP Identity Provisioning Service (IPS)
- Sync users to BTP subaccount

**API Authentication:**
- OAuth2 Client Credentials (machine-to-machine B2B integrations)
- API Keys (developer portal, sandbox/playground use)
- JWT validation in Integration Suite policies

---

## Repository Structure

```
/tpapi
  /frontend              # React SPA (TypeScript, Vite)
    /src
      /pages
        /portal          # E-commerce portal pages
        /devportal       # API Developer Portal pages
      /components        # Shared UI components
      /hooks             # Tanstack Query hooks
      /api               # API client (typed fetch wrappers)
      /auth              # IAS OIDC integration
    vite.config.ts
    package.json
  /iflows                # Integration Suite iFlow export ZIPs or DSL configs
    /transactional
    /read
  /api-specs             # OpenAPI 3.0 YAML specs for each API product
    orders.yaml
    invoices.yaml
    shipments.yaml
    products.yaml
    customers.yaml
  /snowflake             # DDL: views, schemas, user grants
    schema.sql
    views.sql
  /btp-deployment        # MTA descriptors, Kyma Helm charts, CF manifests
    mta.yaml
    /helm
  /docs                  # Architecture docs, ADRs, onboarding guide
    architecture.md
    adr/
  CLAUDE.md
```

### Frontend Route Map

| Route | Component | Auth |
|---|---|---|
| `/login` | Login | Public |
| `/portal/*` | PortalShell + AgeVerificationGate | Age gate → JWT |
| `/portal/catalog` | ProductCatalog | Age gate |
| `/portal/orders` | OrderList | JWT |
| `/portal/orders/new` | PlaceOrder | JWT |
| `/portal/orders/:id` | OrderDetail | JWT |
| `/portal/invoices` | InvoiceList | JWT |
| `/devportal/*` | DevPortalShell | JWT |
| `/devportal/apis` | ApiCatalog | JWT |
| `/devportal/keys` | ApiKeyManager | JWT |
| `/devportal/playground` | Playground | JWT |
| `/devportal/onboarding` | Onboarding | JWT |
| `/devportal/admin` | AdminPanel (legacy) | Admin secret |
| `/admin/*` | AdminShell | Admin secret |
| `/admin/dashboard` | AdminDashboard | Admin secret |
| `/admin/customers` | AdminCustomers | Admin secret |
| `/admin/orders` | AdminOrders | Admin secret |
| `/admin/api-keys` | AdminApiKeys | Admin secret |

### Backend Admin API Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/admin/stats` | Admin | Dashboard aggregate stats |
| `GET /api/admin/orders` | Admin | All orders (cross-customer, filterable) |
| `GET /api/admin/customers` | Admin | Customer list from Snowflake KNA1 |
| `GET /api/customers/admin/registrations` | Admin | All registration requests |
| `PATCH /api/customers/admin/registrations/:id/approve` | Admin | Approve → issue credentials |
| `PATCH /api/customers/admin/registrations/:id/reject` | Admin | Reject registration |
| `GET /api/developer/api-keys/admin/all` | Admin | All API key requests |
| `PATCH /api/developer/api-keys/admin/:id/approve` | Admin | Approve → issue key |
| `PATCH /api/developer/api-keys/admin/:id/reject` | Admin | Reject key request |

---

## Implementation Phases

### Phase 1 — Foundation & Scaffolding
- [ ] Initialize React app (Vite + TypeScript + SAP UI5 Web Components)
- [ ] Set up routing: `/portal/*` and `/devportal/*`
- [ ] BTP Cloud Foundry or Kyma deployment descriptor (mta.yaml / Helm)
- [ ] SAP IAS OIDC integration (login/logout/register flows)
- [ ] Define OpenAPI specs for all 5 API products

### Phase 2 — API Management Setup
- [ ] Create API proxies in Integration Suite API Management
- [ ] Define API products and subscription plans
- [ ] Apply OAuth2 + API Key policies
- [ ] Configure Integration Suite built-in developer portal

### Phase 3 — Integration Flows (Read — Snowflake)
- [ ] Snowflake schema + views DDL
- [ ] iFlow: Get Order Status (Snowflake)
- [ ] iFlow: Get Order History (Snowflake)
- [ ] iFlow: Get Shipment Status (Snowflake)
- [ ] iFlow: Get Product Catalog (Snowflake)

### Phase 4 — Integration Flows (Transactional — S/4)
- [ ] iFlow: Create Sales Order → S/4
- [ ] iFlow: Get Invoice → S/4
- [ ] iFlow: Register Customer → S/4
- [ ] Cloud Connector setup for S/4 on-premise (if applicable)

### Phase 5 — Replication
- [ ] SAP Datasphere project setup
- [ ] S/4 → Snowflake replication flows for core tables
- [ ] Near-real-time CDC validation

### Phase 6 — Frontend Portal
- [x] Product catalog page (reads from Snowflake via IS) — with real images (Unsplash/picsum by category)
- [x] Age verification gate on `/portal/*`
- [ ] Order placement form (writes to S/4 via IS)
- [ ] Order history & status page (reads from Snowflake)
- [ ] Invoice list (reads from S/4)
- [ ] Shipment tracking page

### Phase 7 — Developer Portal
- [x] API catalog page (renders OpenAPI specs via Redoc/Swagger UI)
- [x] API key request + management UI
- [x] Live API playground wired to sandbox environment
- [x] Onboarding wizard (register → get API key → first API call)

### Phase 7b — Admin Portal
- [x] Admin unlock gate (x-admin-secret)
- [x] Dashboard with live platform stats
- [x] Customer list + registration approval workflow
- [x] Cross-customer order view with filters
- [x] API key request approval/rejection

### Phase 8 — Polish & Production Readiness
- [ ] End-to-end test flows (O2C happy path)
- [ ] SAP Cloud Logging + Application Autoscaler setup
- [ ] Rate limit tuning
- [ ] Security hardening (CSP headers, CORS lockdown)
- [ ] Customer onboarding automation (approval workflow in BTP)

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| BTP runtime | Kyma primary, CF fallback | Flexibility; containers portable |
| Frontend framework | React + SAP UI5 Web Components | Modern DX + SAP design system |
| Read layer | Snowflake | Best analytics scale; BTP-native replication via Datasphere |
| API gateway | Integration Suite API Management | Single SAP BTP-native layer; no extra infra |
| Auth | SAP IAS + OAuth2 | Native BTP, enterprise-grade, federated identity |
| Transactional writes | Direct to S/4 via iFlows | Single source of truth for ERP data |
| Read routing | Snowflake via iFlows | Offloads S/4, enables analytics without ERP load |

---

## Verification

- **Frontend:** `cd frontend && npm run dev` — starts on http://localhost:5173 (or 5174 if busy)
- **Backend:** `cd backend && npm run dev` — starts on http://localhost:3001
- **Age gate:** Visit `/portal` without prior verification → gate appears; confirm 18+ → portal loads
- **Admin:** Visit `/admin` → enter admin secret → Dashboard shows live stats
- **API Management:** API proxy returns 200 with valid OAuth2 token; returns 401 without
- **iFlows (read):** GET /products returns product list from Snowflake VIEW
- **iFlows (write):** POST /orders creates a sales order in S/4 sandbox, returns order ID
- **Replication:** Update a sales order in S/4 sandbox → verify status updates in Snowflake within 60s
- **Developer Portal:** New user registers → requests API key → admin approves at `/admin/api-keys` → key active

## Local Dev Notes

- Frontend dev server: http://localhost:5174 (CORS allowed in backend)
- Admin secret: set via `ADMIN_SECRET` env var in backend `.env`
- Age verification reset: DevTools → Application → Local Storage → delete `tpapi_age_verified`
- Admin unlock reset: DevTools → Application → Session Storage → delete `admin_secret`
