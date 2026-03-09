-- ─────────────────────────────────────────────────────────────────────────────
-- TPAPI_READ — Snowflake Read Layer
-- Tables are replicated from S/4HANA via SAP Datasphere (CDC).
-- This file creates the database, warehouse, schema, roles, and raw tables.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Database & schema ──────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS TPAPI_READ;
USE DATABASE TPAPI_READ;

CREATE SCHEMA IF NOT EXISTS RAW    COMMENT = 'CDC-replicated tables from S/4HANA';
CREATE SCHEMA IF NOT EXISTS VIEWS  COMMENT = 'Cleaned views consumed by Integration Suite iFlows';

-- ── Warehouse ───────────────────────────────────────────────────────────────
CREATE WAREHOUSE IF NOT EXISTS TPAPI_WH
  WAREHOUSE_SIZE = 'X-SMALL'
  AUTO_SUSPEND   = 60
  AUTO_RESUME    = TRUE
  COMMENT        = 'TPAPI read-layer queries';

-- ── Roles & grants ─────────────────────────────────────────────────────────
CREATE ROLE IF NOT EXISTS TPAPI_IS_ROLE   COMMENT = 'Integration Suite iFlow service account';
CREATE ROLE IF NOT EXISTS TPAPI_ADMIN     COMMENT = 'Admin role';

GRANT USAGE ON WAREHOUSE TPAPI_WH        TO ROLE TPAPI_IS_ROLE;
GRANT USAGE ON DATABASE  TPAPI_READ      TO ROLE TPAPI_IS_ROLE;
GRANT USAGE ON SCHEMA    TPAPI_READ.VIEWS TO ROLE TPAPI_IS_ROLE;
GRANT SELECT ON ALL VIEWS IN SCHEMA TPAPI_READ.VIEWS TO ROLE TPAPI_IS_ROLE;
GRANT MONITOR FUTURE VIEWS IN SCHEMA TPAPI_READ.VIEWS TO ROLE TPAPI_IS_ROLE;

-- ── RAW tables (replicated by Datasphere CDC) ──────────────────────────────

USE SCHEMA RAW;

-- Sales order header (VBAK)
CREATE TABLE IF NOT EXISTS VBAK (
  VBELN   VARCHAR(10)   NOT NULL COMMENT 'Sales Order Number',
  ERDAT   DATE                   COMMENT 'Creation Date',
  AUART   VARCHAR(4)             COMMENT 'Order Type',
  KUNNR   VARCHAR(10)            COMMENT 'Sold-to Customer',
  NETWR   NUMBER(15,2)           COMMENT 'Net Order Value',
  WAERK   VARCHAR(5)             COMMENT 'Currency',
  VDATU   DATE                   COMMENT 'Requested Delivery Date',
  _REPLICATED_AT TIMESTAMP_NTZ  COMMENT 'Datasphere replication timestamp',
  PRIMARY KEY (VBELN)
);

-- Sales order items (VBAP)
CREATE TABLE IF NOT EXISTS VBAP (
  VBELN   VARCHAR(10)  NOT NULL,
  POSNR   VARCHAR(6)   NOT NULL,
  MATNR   VARCHAR(18)            COMMENT 'Material Number',
  ARKTX   VARCHAR(40)            COMMENT 'Item Description',
  KWMENG  NUMBER(13,3)           COMMENT 'Order Quantity',
  VRKME   VARCHAR(3)             COMMENT 'Sales Unit',
  NETPR   NUMBER(11,2)           COMMENT 'Net Price',
  NETWR   NUMBER(13,2)           COMMENT 'Net Value',
  _REPLICATED_AT TIMESTAMP_NTZ,
  PRIMARY KEY (VBELN, POSNR)
);

-- Sales document flow (VBFA)
CREATE TABLE IF NOT EXISTS VBFA (
  VBELV   VARCHAR(10) COMMENT 'Preceding Doc',
  POSNV   VARCHAR(6),
  VBELN   VARCHAR(10) COMMENT 'Subsequent Doc',
  POSNN   VARCHAR(6),
  VBTYP_N VARCHAR(1)  COMMENT 'Subsequent Doc Category',
  _REPLICATED_AT TIMESTAMP_NTZ
);

-- Delivery header (LIKP)
CREATE TABLE IF NOT EXISTS LIKP (
  VBELN   VARCHAR(10) NOT NULL   COMMENT 'Delivery Number',
  ERDAT   DATE,
  LFART   VARCHAR(4)             COMMENT 'Delivery Type',
  KUNNR   VARCHAR(10)            COMMENT 'Ship-to Customer',
  LFDAT   DATE                   COMMENT 'Delivery Date',
  TRAID   VARCHAR(20)            COMMENT 'Tracking ID',
  SPEDL   VARCHAR(10)            COMMENT 'Forwarding Agent',
  WBSTK   VARCHAR(1)             COMMENT 'Goods Movement Status',
  _REPLICATED_AT TIMESTAMP_NTZ,
  PRIMARY KEY (VBELN)
);

-- Delivery items (LIPS)
CREATE TABLE IF NOT EXISTS LIPS (
  VBELN   VARCHAR(10) NOT NULL,
  POSNR   VARCHAR(6)  NOT NULL,
  MATNR   VARCHAR(18),
  ARKTX   VARCHAR(40),
  LFIMG   NUMBER(13,3)           COMMENT 'Actual Delivery Qty',
  VRKME   VARCHAR(3),
  _REPLICATED_AT TIMESTAMP_NTZ,
  PRIMARY KEY (VBELN, POSNR)
);

-- Billing document header (VBRK)
CREATE TABLE IF NOT EXISTS VBRK (
  VBELN   VARCHAR(10) NOT NULL   COMMENT 'Billing Document',
  ERDAT   DATE,
  FKART   VARCHAR(4)             COMMENT 'Billing Type',
  KUNRG   VARCHAR(10)            COMMENT 'Payer Customer',
  NETWR   NUMBER(15,2),
  WAERK   VARCHAR(5),
  FKDAT   DATE                   COMMENT 'Billing Date',
  FKSTO   VARCHAR(1)             COMMENT 'Cancellation Status',
  ZFBDT   DATE                   COMMENT 'Baseline Date for Payment',
  _REPLICATED_AT TIMESTAMP_NTZ,
  PRIMARY KEY (VBELN)
);

-- Billing document items (VBRP)
CREATE TABLE IF NOT EXISTS VBRP (
  VBELN   VARCHAR(10) NOT NULL,
  POSNR   VARCHAR(6)  NOT NULL,
  MATNR   VARCHAR(18),
  ARKTX   VARCHAR(40),
  FKIMG   NUMBER(13,3),
  VRKME   VARCHAR(3),
  NETWR   NUMBER(13,2),
  _REPLICATED_AT TIMESTAMP_NTZ,
  PRIMARY KEY (VBELN, POSNR)
);

-- Material master (MARA)
CREATE TABLE IF NOT EXISTS MARA (
  MATNR   VARCHAR(18) NOT NULL,
  MTART   VARCHAR(4)  COMMENT 'Material Type',
  MAKTX   VARCHAR(40) COMMENT 'Description (from MAKT)',
  MEINS   VARCHAR(3)  COMMENT 'Base Unit of Measure',
  MATKL   VARCHAR(9)  COMMENT 'Material Group',
  MMSTA   VARCHAR(2)  COMMENT 'Plant-specific Material Status',
  _REPLICATED_AT TIMESTAMP_NTZ,
  PRIMARY KEY (MATNR)
);

-- Material sales views (MVKE)
CREATE TABLE IF NOT EXISTS MVKE (
  MATNR   VARCHAR(18) NOT NULL,
  VKORG   VARCHAR(4)  NOT NULL   COMMENT 'Sales Org',
  VTWEG   VARCHAR(2)  NOT NULL   COMMENT 'Distribution Channel',
  DWERK   VARCHAR(4)             COMMENT 'Delivering Plant',
  NETPR   NUMBER(11,2)           COMMENT 'Net Price',
  WAERK   VARCHAR(5),
  _REPLICATED_AT TIMESTAMP_NTZ,
  PRIMARY KEY (MATNR, VKORG, VTWEG)
);

-- Customer master (KNA1)
CREATE TABLE IF NOT EXISTS KNA1 (
  KUNNR   VARCHAR(10) NOT NULL,
  NAME1   VARCHAR(35),
  STRAS   VARCHAR(35) COMMENT 'Street',
  ORT01   VARCHAR(35) COMMENT 'City',
  LAND1   VARCHAR(3)  COMMENT 'Country',
  TELF1   VARCHAR(16) COMMENT 'Phone',
  SMTP_ADDR VARCHAR(241) COMMENT 'Email',
  STCD1   VARCHAR(16) COMMENT 'Tax Number 1',
  _REPLICATED_AT TIMESTAMP_NTZ,
  PRIMARY KEY (KUNNR)
);
