-- ─────────────────────────────────────────────────────────────────────────────
-- TPAPI_READ.VIEWS — Snowflake views consumed by Integration Suite iFlows
-- All views are customer-scoped; iFlows pass :CUSTOMER_ID as a bind parameter.
-- ─────────────────────────────────────────────────────────────────────────────

USE DATABASE TPAPI_READ;
USE SCHEMA VIEWS;

-- ── V_ORDER_STATUS ─────────────────────────────────────────────────────────
-- Triggered by: GET /orders/{id}/status
-- iFlow passes: :ORDER_ID, :CUSTOMER_ID
CREATE OR REPLACE VIEW V_ORDER_STATUS AS
SELECT
  h.VBELN                                        AS ORDER_ID,
  h.KUNNR                                        AS CUSTOMER_ID,
  CASE
    WHEN h.AUART = 'ZCN'                        THEN 'CANCELLED'
    WHEN d.WBSTK = 'C'                          THEN 'DELIVERED'
    WHEN d.VBELN IS NOT NULL                    THEN 'IN_DELIVERY'
    WHEN f.VBELN IS NOT NULL AND f.VBTYP_N='J' THEN 'CONFIRMED'
    ELSE 'SUBMITTED'
  END                                            AS STATUS,
  GREATEST(
    h._REPLICATED_AT,
    COALESCE(d._REPLICATED_AT, '1900-01-01'),
    COALESCE(f._REPLICATED_AT, '1900-01-01')
  )                                              AS UPDATED_AT
FROM RAW.VBAK h
LEFT JOIN RAW.VBFA f
  ON f.VBELV = h.VBELN AND f.VBTYP_N IN ('J', 'T')
LEFT JOIN RAW.LIKP d
  ON d.VBELN = f.VBELN;

-- ── V_ORDER_HISTORY ────────────────────────────────────────────────────────
-- Triggered by: GET /orders
-- Returns flattened order list per customer.
CREATE OR REPLACE VIEW V_ORDER_HISTORY AS
SELECT
  h.VBELN                                        AS ORDER_ID,
  h.KUNNR                                        AS CUSTOMER_ID,
  h.ERDAT                                        AS CREATED_DATE,
  h.NETWR                                        AS TOTAL_AMOUNT,
  h.WAERK                                        AS CURRENCY,
  h.VDATU                                        AS DELIVERY_DATE,
  COUNT(i.POSNR)                                 AS ITEM_COUNT,
  CASE
    WHEN h.AUART = 'ZCN'   THEN 'CANCELLED'
    WHEN d.WBSTK = 'C'     THEN 'DELIVERED'
    WHEN d.VBELN IS NOT NULL THEN 'IN_DELIVERY'
    WHEN f.VBELN IS NOT NULL THEN 'CONFIRMED'
    ELSE 'SUBMITTED'
  END                                            AS STATUS
FROM RAW.VBAK h
LEFT JOIN RAW.VBAP i  ON i.VBELN = h.VBELN
LEFT JOIN RAW.VBFA f  ON f.VBELV = h.VBELN AND f.VBTYP_N IN ('J','T')
LEFT JOIN RAW.LIKP d  ON d.VBELN = f.VBELN
GROUP BY
  h.VBELN, h.KUNNR, h.ERDAT, h.NETWR, h.WAERK, h.VDATU,
  h.AUART, d.WBSTK, d.VBELN, f.VBELN;

-- ── V_SHIPMENT_STATUS ──────────────────────────────────────────────────────
-- Triggered by: GET /shipments/{orderId}
-- Joins VBFA (order→delivery flow) to LIKP (delivery/shipment header).
CREATE OR REPLACE VIEW V_SHIPMENT_STATUS AS
SELECT
  d.VBELN                                        AS SHIPMENT_ID,
  f.VBELV                                        AS ORDER_ID,
  d.KUNNR                                        AS CUSTOMER_ID,
  CASE d.WBSTK
    WHEN 'C'  THEN 'DELIVERED'
    WHEN 'A'  THEN 'IN_TRANSIT'
    ELSE           'PENDING'
  END                                            AS STATUS,
  d.SPEDL                                        AS CARRIER,
  d.TRAID                                        AS TRACKING_NUMBER,
  d.LFDAT                                        AS ESTIMATED_DELIVERY,
  d._REPLICATED_AT                               AS UPDATED_AT
FROM RAW.LIKP d
JOIN RAW.VBFA f ON f.VBELN = d.VBELN AND f.VBTYP_N = 'J';

-- ── V_PRODUCT_CATALOG ──────────────────────────────────────────────────────
-- Triggered by: GET /products
-- Active product master with pricing from MVKE.
CREATE OR REPLACE VIEW V_PRODUCT_CATALOG AS
SELECT
  m.MATNR                                        AS PRODUCT_ID,
  m.MAKTX                                        AS PRODUCT_NAME,
  m.MATKL                                        AS CATEGORY,
  m.MEINS                                        AS BASE_UNIT,
  v.NETPR                                        AS PRICE,
  v.WAERK                                        AS CURRENCY,
  v.VKORG                                        AS SALES_ORG,
  v.VTWEG                                        AS DIST_CHANNEL,
  CASE WHEN m.MMSTA IS NULL THEN TRUE ELSE FALSE END AS AVAILABLE
FROM RAW.MARA m
JOIN RAW.MVKE v ON v.MATNR = m.MATNR
WHERE m.MMSTA IS NULL   -- no blocking flag = available
  AND m.MTART IN ('FERT','HAWA','NLAG'); -- Finished, Trading, Non-stock

-- ── V_INVOICE_LIST ─────────────────────────────────────────────────────────
-- Triggered by: GET /invoices
-- Billing documents per customer with payment status.
CREATE OR REPLACE VIEW V_INVOICE_LIST AS
SELECT
  b.VBELN                                        AS INVOICE_ID,
  b.KUNRG                                        AS CUSTOMER_ID,
  b.ERDAT                                        AS ISSUED_DATE,
  b.FKDAT                                        AS BILLING_DATE,
  b.ZFBDT                                        AS DUE_DATE,
  b.NETWR                                        AS TOTAL_AMOUNT,
  b.WAERK                                        AS CURRENCY,
  f.VBELV                                        AS ORDER_ID,
  CASE
    WHEN b.FKSTO = 'X'             THEN 'CANCELLED'
    WHEN CURRENT_DATE > b.ZFBDT   THEN 'OVERDUE'
    ELSE 'OPEN'
  END                                            AS STATUS
FROM RAW.VBRK b
LEFT JOIN RAW.VBFA f
  ON f.VBELN = b.VBELN AND f.VBTYP_N = 'M'
WHERE b.FKART IN ('F2','RE','RD');  -- standard, credit, debit invoices

-- ── Grant SELECT on all views to IS role ───────────────────────────────────
GRANT SELECT ON ALL VIEWS IN SCHEMA TPAPI_READ.VIEWS TO ROLE TPAPI_IS_ROLE;
