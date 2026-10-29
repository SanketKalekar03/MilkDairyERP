# Gokul Dairy — Milk Collection & Sales Management ERP

A production-ready, backend-authoritative web application engineered for dairy cooperatives, Bulk Milk Coolers (BMCs), and Automatic Milk Collection Units (AMCUs). The platform manages farmer milk procurement, retail sales distribution, dynamic fat-based slab pricing, continuous 24/7 automated shifts, real-time tank inventory, atomic weekly billing settlements, and official printable tax invoices.

---

## Table of Contents

1. [Executive Summary & Core Philosophy](#1-executive-summary--core-philosophy)
2. [System Architecture](#2-system-architecture)
3. [Design System & UI Color Palette](#3-design-system--ui-color-palette)
4. [Core Business Rules & Operational Logic](#4-core-business-rules--operational-logic)
   - [Strict Litres-Only Standardization](#strict-litres-only-standardization)
   - [24/7 Continuous Shift Engine](#247-continuous-shift-engine)
   - [Dynamic Fat-Based Procurement Rates](#dynamic-fat-based-procurement-rates)
   - [Fixed Retail Selling Rates](#fixed-retail-selling-rates)
   - [Atomic Billing & Immutability Guarantees](#atomic-billing--immutability-guarantees)
5. [Feature Modules & Workflow Breakdown](#5-feature-modules--workflow-breakdown)
   - [Dashboard & Operational Mission Control](#dashboard--operational-mission-control)
   - [Milk Collection (Procurement)](#milk-collection-procurement)
   - [Milk Sales (Distribution)](#milk-sales-distribution)
   - [Real-Time Tank Stock & Silo Inventory](#real-time-tank-stock--silo-inventory)
   - [Weekly Settlement & Billing Engine](#weekly-settlement--billing-engine)
   - [Official Printable Legal Invoices](#official-printable-legal-invoices)
   - [Farmer & Customer Directory](#farmer--customer-directory)
   - [Rate Rule Administration](#rate-rule-administration)
   - [Shift & Dairy Settings](#shift--dairy-settings)
   - [User & Access Management](#user--access-management)
6. [Database Schema & Architecture](#6-database-schema--architecture)
   - [Database Tables](#database-tables)
   - [PostgreSQL Stored Procedures & RPC Functions](#postgresql-stored-procedures--rpc-functions)
   - [Database Triggers & ACID Integrity](#database-triggers--acid-integrity)
   - [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
7. [Role & Permission Matrix](#7-role--permission-matrix)
8. [Setup, Configuration & Deployment Guide](#8-setup-configuration--deployment-guide)
   - [Prerequisites](#prerequisites)
   - [Environment Configuration](#environment-configuration)
   - [Supabase Database Migration Sequence](#supabase-database-migration-sequence)
   - [Default Seed Accounts & Testing](#default-seed-accounts--testing)
   - [Frontend Build & Development](#frontend-build--development)
9. [Project Directory Structure](#9-project-directory-structure)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)

---

## 1. Executive Summary & Core Philosophy

Operating an AMCU or dairy cooperative requires zero tolerance for financial discrepancies, milk volume rounding leaks, or out-of-order historical tampering. Many legacy desktop AMCU solutions suffer from local clock manipulation, inconsistent units (mixing kg and litres), and vulnerable spreadsheet exports.

Gokul Dairy ERP solves this with a **strict backend-authoritative architecture**:
- **All calculations are finalized inside PostgreSQL `SECURITY DEFINER` functions.** The browser UI only previews calculations; rates, amounts, shifts, and timestamps are stamped immutably on the database server.
- **Strict Single Unit of Measure:** All liquid milk is measured and recorded in **Litres (`L`)**. Kilograms (`kg`) have been eliminated across the entire system, preventing density conversion errors.
- **Continuous 24/7 Operations:** Dairy intake never stops. The system divides each 24-hour cycle into two continuous 12-hour shifts: Morning (06:00 to 18:00) and Evening (18:00 to 06:00).
- **Atomic Billing Locks:** Finalized bills permanently lock attached procurement transactions. No farmer record can be billed twice, deleted, or altered post-settlement.

---

## 2. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   React 19 Client (SPA with Vite)                      │
│  - React Router v7 Protected Routes                                    │
│  - Form State Management with React Hook Form & Zod Validation         │
│  - Tailwind CSS with High-Density Dairy Palette                        │
│  - Real-Time Shift Provider (Auto-timed 6 AM - 6 PM cycle)             │
│  - React Portal-Isolated Printing Engine                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Supabase Auth (JWT Bearer Token)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Supabase Gateway / PostgreSQL RPC                    │
│  - Session Validation & Role-Based Access Control (Admin vs. Operator) │
│  - Authoritative RPC Endpoint Invocations                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ACID Stored Procedures (SECURITY DEFINER)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database Engine                            │
│  ├── Core Functions:                                                   │
│  │     - get_current_shift() [06:00-18:00 Morning / 18:00-06:00 Evening]│
│  │     - get_collection_rate() [Dynamic Tiered Fat Slab Matching]       │
│  │     - record_milk_collection() [ACID Insert + Balance Update]       │
│  │     - record_milk_sale() [ACID Insert + Balance Update]             │
│  │     - get_current_day_dashboard() [Consolidated Daily Metrics]      │
│  │     - get_milk_stock() [Real-Time Tank Volume Ledger]               │
│  │     - create_farmer_weekly_bill() [Atomic Unbilled Aggregation]     │
│  │     - finalize_farmer_weekly_bill() [Permanent Lock Trigger]        │
│  ├── Tables:                                                           │
│  │     - profiles, farmers, customers, dairy_settings                  │
│  │     - collection_rate_rules, selling_rates                          │
│  │     - milk_collections, milk_sales                                  │
│  │     - farmer_weekly_bills, farmer_weekly_bill_items                 │
│  │     - customer_weekly_bills, customer_weekly_bill_items             │
│  │     - milk_stock_adjustments                                        │
│  └── Safeguards:                                                       │
│        - Triggers (protect_finalized_bill_items, update_timestamps)     │
│        - CHECK Constraints (non-negative litres, fat ranges, rates)    │
│        - Row-Level Security (RLS) Policies on all public tables        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Design System & UI Color Palette

The interface is built to provide high contrast, low eye fatigue in dimly lit collection centers, and clear distinction between operations:

| Color Token | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| **Dairy Navy** | `#2F4156` | Primary brand color, sidebar background, main headings, table total rows, primary CTA buttons. |
| **Dairy Teal** | `#567C8D` | Secondary labels, icon accents, muted subheadings, tab controls, inactive borders. |
| **Dairy Sky** | `#C8D9E6` | Soft highlights, badge backgrounds, table hover states, subtle card borders (`#afc4d4`). |
| **Dairy Beige** | `#F5EFEB` | Warm application canvas, section header strips, input background, off-white card fills. |
| **Clean White** | `#FFFFFF` | Metric cards, modal surfaces, form bodies, printed paper background. |
| **Emerald Accent** | `#059669` | Milk Sales indicators, positive net retained margins, "In Stock" health badges. |
| **Amber Accent** | `#D97706` | Morning shift Sun badges, active shift indicators, "Low Stock" warnings. |
| **Rose Accent** | `#E11D48` | Negative day balance, oversold stock alerts, delete/cancel actions. |

---

## 4. Core Business Rules & Operational Logic

### Strict Litres-Only Standardization
1. In dairy processing, storing quantities in multiple units (e.g. kg and litres) introduces constant density conversion discrepancies ($1\text{ L of milk} \approx 1.028\text{ to }1.034\text{ kg}$).
2. To ensure absolute parity between farmer pouring, tank volume, retail dispatch, and billing, **every milk quantity is stored and computed in Litres (`L`)** to 3 decimal places (`0.000 L`).
3. Inputs, formulas, database constraints, and invoices reject and omit all Kilogram references.

### 24/7 Continuous Shift Engine
Milk collection operations run continuously throughout day and night. The 24-hour cycle is segmented into two non-overlapping 12-hour windows:
- **Morning Shift:** `06:00:00` to `17:59:59` (6:00 AM – 6:00 PM)
- **Evening Shift:** `18:00:00` to `05:59:59` (6:00 PM – 6:00 AM the following morning)

```sql
-- Database Authoritative Shift Determination (Timezone: Asia/Kolkata)
IF (v_curr_time >= '06:00:00'::TIME AND v_curr_time < '18:00:00'::TIME) THEN
  RETURN 'morning';
ELSE
  RETURN 'evening';
END IF;
```
- The frontend `ShiftProvider` runs an active timer, automatically updating UI shift badges without requiring page reloads.
- The PostgreSQL database stamps the authoritative shift upon saving transactions.

### Dynamic Fat-Based Procurement Rates
- Farmers are paid dynamically based on the **Fat Percentage** of the milk delivered (e.g., $3.0\%$ to $10.0\%$).
- Rates are defined in tiered slabs in `collection_rate_rules`:
  $$\text{min\_fat} \le \text{fat\_percent} \le \text{max\_fat}$$
- Separate tiered rate schedules exist for **Cow Milk** and **Buffalo Milk**.
- When an intake is recorded, the database finds the active rate rule matching `(milk_type, fat_percent, effective_date)` and locks `applied_rate` permanently into the collection record:
  $$\text{Amount (₹)} = \text{Quantity (Litres)} \times \text{Applied Rate (₹/L)}$$

### Fixed Retail Selling Rates
- Milk sold to retail customers or local businesses is priced via `selling_rates`.
- Separate rates per litre are maintained for Cow Milk and Buffalo Milk.
- Rates are effective-dated; modifying selling rates only applies to future sales, never altering historical receipts.

### Atomic Billing & Immutability Guarantees
- Weekly bills aggregate all **unbilled** milk records between a `period_start` and `period_end`.
- **Atomic Creation:** Stored procedure `create_farmer_weekly_bill` selects unbilled items, calculates totals, creates the bill, and links item mappings in a single ACID transaction.
- **Double-Billing Safeguard:** A collection record linked to a finalized bill cannot be included in any other bill.
- **Lock Trigger:** Once a bill's status is changed from `draft` to `finalized`, a database trigger (`protect_finalized_bill_items`) blocks all `UPDATE` or `DELETE` queries on the associated intake records.

---

## 5. Feature Modules & Workflow Breakdown

### Dashboard & Operational Mission Control
**Route:** `/dashboard`

The dashboard functions as the central operator hub:
1. **Top Header & Live Status:**
   - Operator greeting with role badge (`Admin` or `Operator`).
   - Active Shift Pill with live pulsating indicator (`Morning 6 AM – 6 PM` or `Evening 6 PM – 6 AM`).
   - Quick Action CTA buttons: `+ Record Collection` and `+ Record Sale`.
   - Single interactive Date Picker that auto-refreshes all metrics on selection, featuring a quick `"Today"` reset button when viewing past dates.
2. **Compact Executive 4-KPI Row:**
   - **Today Collection (Blue):** Total litres collected, value in ₹, morning/evening split, and entry count.
   - **Today Sales (Emerald):** Total litres sold, revenue in ₹, morning/evening split, and transaction count.
   - **Active Shift (Amber):** Real-time intake litres, sales litres, and transaction activity for the current shift.
   - **Available Stock (Purple):** Total litres ready in tanks, Cow vs. Buffalo split, and quick navigation to `/stock`.
3. **Real-Time Milk Tank & Silo Inventory:**
   - Visual Cow Milk Tank and Buffalo Milk Tank cards.
   - Animated visual fill gauge (color-coded for Optimal Stock $>10\text{ L}$, Low Stock, Empty, or Deficit).
   - 3-point flow metrics: **Today In** (with Morning/Evening breakdown), **Today Out** (retail sales), and **Net Today** (retained surplus or deficit).
4. **Interactive Shift Operations Hub:**
   - Segmented tab navigation: `[ ☀️ Morning ]`, `[ 🌙 Evening ]`, `[ 📊 All Shifts ]`.
   - Automatically defaults to whichever shift is currently active.
   - Features a **Shift Summary Ribbon**: Shift Procured, Shift Sold, Net Retained, and Total Activity.
   - Side-by-side procurement and distribution breakdown tables with direct `+ New Entry` links.

---

### Milk Collection (Procurement)
**Routes:** `/collection` (Intake Form) | `/collection/history` (Audit Log)

1. **Farmer Identification:** Fast autocomplete search by Farmer Name or ID.
2. **Shift & Date:** Automatically populated with current business date and authoritative shift.
3. **Milk Parameters:**
   - Selection between **Cow Milk** or **Buffalo Milk**.
   - Input **Quantity in Litres (`L`)** (validated $>0$).
   - Input **Fat Percentage (`%`)** (validated $2.0\%$ to $15.0\%$).
4. **Live Rate Preview:** As the operator types, the form queries `get_collection_rate` and renders the applied rate and total ₹ payout in real time.
5. **Instant Slip Receipt:** Upon saving, displays a success confirmation with an option to print an immediate thermal intake receipt.

---

### Milk Sales (Distribution)
**Routes:** `/sales` (Sales Form) | `/sales/history` (Audit Log)

1. **Customer Selection:** Select from registered regular customers or choose Cash / Walk-in buyer.
2. **Milk Type & Quantity:** Choose Cow or Buffalo Milk and enter Litres to sell.
3. **Price Calculation:** Instantly retrieves the active fixed selling rate per litre.
4. **Stock Validation:** Highlights available tank volume to prevent overselling.
5. **History Log:** Searchable table of all retail sales with shift, date, and customer filters.

---

### Real-Time Tank Stock & Silo Inventory
**Route:** `/stock`

Provides Bulk Milk Cooler (BMC) managers full physical inventory visibility:
- **Total Stock Overview:** Total liquid volume in dairy storage across all tanks.
- **Cow Milk Tank Ledger:** Cumulative intake vs. cumulative outflow with calculated closing balance.
- **Buffalo Milk Tank Ledger:** Cumulative intake vs. cumulative outflow with calculated closing balance.
- **Audit & Calibration Adjustments:** Allows authorized administrators to log calibration, spillage, quality testing, or physical dipstick adjustments with audit notes.

---

### Weekly Settlement & Billing Engine
**Routes:** `/billing/farmers` (Farmer Settlement) | `/billing/customers` (Customer Invoicing)

1. **Bill Generation:**
   - Select farmer or customer (or leave blank to process all).
   - Select 7-day settlement window (e.g., 15th to 22nd of the month).
   - System invokes `create_farmer_weekly_bill` to aggregate unbilled records.
2. **Draft Review:**
   - Operators can review itemized intake rows, verify average fat percentage, and inspect total payable amounts.
3. **Finalization:**
   - Clicking **Finalize Bill** commits the settlement, marks status as `finalized`, and permanently locks transactions against alteration.

---

### Official Printable Legal Invoices
**Trigger:** Click **Print Invoice** inside any bill detail view (`BillDetailModal.tsx`).

Generates an A4 legal settlement invoice formatted for laser or desktop printers:
- **Letterhead:** Official branding (`GOKUL DAIRY - Milk Collection & Distribution Center`), complex address, and phone number.
- **Invoice Metadata:** Invoice Number (`WB-FMR-...` or `WB-CUST-...`), Issue Date, Period Dates, and Status Badge.
- **Recipient Section:** Supplier Name, Phone Number, and Registered ID.
- **Complete Itemized Table:** Full multi-row breakdown (Date, Shift, Milk Type, Litres, Fat %, Rate, Total Amount) printed completely without scrollbars or cutoff borders.
- **Totals Summary:** Total Volume, Average Fat %, and Grand Total Payable.
- **Legal Indian Currency in Words:** Native translation (e.g. *"Three Hundred Eighty Rupees Only"*) generated by `amountToWords()`.
- **Dual Signature Blocks:** Left block for **Farmer / Receiver Signature**; right block for **Authorized Signatory (For Gokul Dairy)**.
- **Print Isolation:** Uses a React Portal (`createPortal(..., document.body)`) and strict `@media print` rules to hide all web navigation, modal backdrops, and action buttons during print.

---

### Farmer & Customer Directory
**Routes:** `/farmers` | `/customers`

- **Farmer Profiles:** Name, Phone Number, Milk Type preference, Bank Account / IFSC details, and Active/Inactive toggle.
- **Customer Profiles:** Name, Phone Number, Default Daily Quota (L), Address, and Active status.
- **Passbook Lookup:** View historical collections and lifetime payouts per individual producer or buyer.

---

### Rate Rule Administration
**Routes:** `/rates/collection` (Admin Only) | `/rates/selling` (Admin Only)

- **Collection Slabs:** Define tiered fat ranges (e.g., $3.5\% - 4.0\% \rightarrow ₹36.00/\text{L}$, $4.1\% - 4.5\% \rightarrow ₹38.00/\text{L}$) with effective start dates.
- **Selling Rates:** Set fixed retail selling rates per litre for Cow and Buffalo milk.
- **Access Guard:** Restricted to `admin` role via `AdminRoute` and Supabase RLS.

---

### Shift & Dairy Settings
**Route:** `/settings/shifts` (Admin Only)

- Displays configured operational shift windows (6:00 AM – 6:00 PM Morning, 6:00 PM – 6:00 AM Evening).
- Dairy Center configuration parameters and timezone confirmation (`Asia/Kolkata`).

---

### User & Access Management
**Route:** `/users` (Admin Only)

- Manage dairy staff credentials, email logins, full names, and system roles (`admin` vs. `operator`).
- Enforces role-based permission boundaries across UI routes and database operations.

---

## 6. Database Schema & Architecture

### Database Tables

```sql
-- 1. User Profiles & Roles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator')),
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Farmers Master (Milk Suppliers)
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  default_milk_type VARCHAR(10) CHECK (default_milk_type IN ('cow', 'buffalo')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Customers Master (Milk Buyers)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  default_milk_type VARCHAR(10) CHECK (default_milk_type IN ('cow', 'buffalo')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tiered Collection Rate Rules (Fat-Based Slabs)
CREATE TABLE public.collection_rate_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milk_type VARCHAR(10) NOT NULL CHECK (milk_type IN ('cow', 'buffalo')),
  min_fat NUMERIC(4,2) NOT NULL CHECK (min_fat >= 0),
  max_fat NUMERIC(4,2) NOT NULL CHECK (max_fat >= min_fat),
  rate_per_unit NUMERIC(8,2) NOT NULL CHECK (rate_per_unit >= 0),
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Fixed Selling Rates
CREATE TABLE public.selling_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milk_type VARCHAR(10) NOT NULL CHECK (milk_type IN ('cow', 'buffalo')),
  rate_per_litre NUMERIC(8,2) NOT NULL CHECK (rate_per_litre >= 0),
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Raw Milk Collections (Intake Transactions)
CREATE TABLE public.milk_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id),
  business_date DATE NOT NULL,
  shift VARCHAR(10) NOT NULL CHECK (shift IN ('morning', 'evening')),
  milk_type VARCHAR(10) NOT NULL CHECK (milk_type IN ('cow', 'buffalo')),
  quantity NUMERIC(10,3) NOT NULL CHECK (quantity > 0), -- Measured in Litres
  fat_percent NUMERIC(4,2) NOT NULL CHECK (fat_percent >= 0 AND fat_percent <= 100),
  applied_rate NUMERIC(8,2) NOT NULL CHECK (applied_rate >= 0),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  operator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Milk Sales (Distribution Transactions)
CREATE TABLE public.milk_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  business_date DATE NOT NULL,
  shift VARCHAR(10) NOT NULL CHECK (shift IN ('morning', 'evening')),
  milk_type VARCHAR(10) NOT NULL CHECK (milk_type IN ('cow', 'buffalo')),
  quantity_litres NUMERIC(10,3) NOT NULL CHECK (quantity_litres > 0), -- Measured in Litres
  applied_rate NUMERIC(8,2) NOT NULL CHECK (applied_rate >= 0),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  operator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Weekly Bills & Item Junctions
CREATE TABLE public.farmer_weekly_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL CHECK (period_end >= period_start),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.farmer_weekly_bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.farmer_weekly_bills(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.milk_collections(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_farmer_bill_collection UNIQUE (collection_id)
);
```

---

### PostgreSQL Stored Procedures & RPC Functions

| Function Name | Return Type | Description |
| :--- | :--- | :--- |
| `get_current_shift(p_timezone, p_time)` | `VARCHAR` | Evaluates current clock time in `Asia/Kolkata` and returns `'morning'` (06:00-18:00) or `'evening'` (18:00-06:00). |
| `get_collection_rate(p_milk_type, p_fat, p_date)` | `NUMERIC` | Finds active rate rule for milk type where fat percentage falls between `min_fat` and `max_fat`. |
| `get_selling_rate(p_milk_type, p_date)` | `NUMERIC` | Retrieves effective retail price per litre for Cow or Buffalo milk. |
| `record_milk_collection(...)` | `JSON` | Authoritatively calculates rate and total amount, saves collection record, and returns inserted entity. |
| `record_milk_sale(...)` | `JSON` | Verifies selling rate, validates quantity, saves sales record, and returns inserted entity. |
| `get_current_day_dashboard(p_target_date)` | `JSON` | Aggregates collection and sales totals, shift splits, and transaction counts for the specified business date. |
| `get_milk_stock(p_target_date)` | `JSON` | Aggregates cumulative procurement vs. sales per milk type to produce real-time available tank balances. |
| `create_farmer_weekly_bill(p_farmer_id, p_start, p_end)` | `UUID` | Queries unbilled collection records in range, calculates sum, inserts `farmer_weekly_bills` and junction items atomically. |
| `finalize_farmer_weekly_bill(p_bill_id)` | `BOOLEAN` | Sets bill status to `'finalized'`, permanently locking all attached collection records. |
| `create_customer_weekly_bill(...)` | `UUID` | Aggregates unbilled sales records for customer billing. |
| `finalize_customer_weekly_bill(...)` | `BOOLEAN` | Sets customer bill status to `'finalized'`, locking sales records. |

---

### Database Triggers & ACID Integrity

1. **`protect_finalized_bill_items` Trigger:**
   Executes before `UPDATE` or `DELETE` on `milk_collections` and `milk_sales`. If the transaction ID is linked to a bill where `status = 'finalized'`, the operation is rejected with an exception:
   ```text
   ERROR: Cannot modify or delete transaction linked to a finalized weekly bill.
   ```
2. **`check_rate_rule_no_overlap` Trigger:**
   Ensures that for a given `milk_type` and `effective_date`, no two fat percentage ranges overlap, preventing pricing ambiguity.
3. **`update_updated_at_column` Trigger:**
   Automatically updates `updated_at = now()` whenever a record in `profiles`, `farmers`, `customers`, or `dairy_settings` is modified.

---

### Row-Level Security (RLS) Policies

All tables have RLS enabled:
- **`profiles`:** Authenticated users can read their own profile; admins can view and edit all profiles.
- **`farmers` & `customers`:** All authenticated users (Admin and Operator) can view and register records; only admins can deactivate profiles.
- **`collection_rate_rules` & `selling_rates`:** Operators have `SELECT` access; only admins can `INSERT`, `UPDATE`, or `DELETE`.
- **`milk_collections` & `milk_sales`:** Operators and admins can record and query entries; modifications are guarded by finalized bill triggers.
- **`dairy_settings`:** Read access for all staff; write access strictly restricted to admins.

---

## 7. Role & Permission Matrix

| Feature / Action | Admin | Operator | Enforcement Layer |
| :--- | :---: | :---: | :--- |
| **View Dashboard & Metrics** | Yes | Yes | UI & RPC Access |
| **Record Milk Collection** | Yes | Yes | `record_milk_collection` RPC |
| **Record Milk Sale** | Yes | Yes | `record_milk_sale` RPC |
| **View Collection & Sales History** | Yes | Yes | Table RLS (`SELECT`) |
| **View Real-Time Milk Tank Stock** | Yes | Yes | `get_milk_stock` RPC |
| **Create/Edit Farmers & Customers** | Yes | Yes | Table RLS (`INSERT`/`UPDATE`) |
| **Generate Draft Weekly Bills** | Yes | Yes | `create_*_weekly_bill` RPC |
| **Finalize Weekly Bills** | Yes | Yes | `finalize_*_weekly_bill` RPC |
| **Print Legal Billing Invoices** | Yes | Yes | Client-Side Print Portal |
| **Create / Modify Collection Rates** | Yes | No | RLS (`INSERT`/`UPDATE` on rate rules) |
| **Create / Modify Selling Rates** | Yes | No | RLS (`INSERT`/`UPDATE` on selling rates) |
| **Update Dairy Settings & Shifts** | Yes | No | RLS on `dairy_settings` |
| **Create & Manage Staff User Accounts** | Yes | No | `AdminRoute` & Auth Admin API |
| **Log Stock Calibration Adjustments** | Yes | No | RLS on `milk_stock_adjustments` |

---

## 8. Setup, Configuration & Deployment Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **NPM:** v9.0.0 or higher
- **Supabase Account:** Free or Pro project instance (PostgreSQL 15+)

---

### Environment Configuration
Create a `.env` file in the project root:

```env
# Supabase Project Connection
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### Supabase Database Migration Sequence

To deploy or restore the complete database schema, open the **Supabase SQL Editor** and execute the migration files located in `supabase/migrations/` in the following chronological order:

```text
1. supabase/migrations/20261022000000_initial_dairy_schema.sql
   └─ Creates core tables, base functions, RLS policies, and triggers.

2. supabase/migrations/20261022000001_auth_profile_trigger.sql
   └─ Configures automatic user profile creation upon Supabase Auth sign-up.

3. supabase/migrations/20261022000002_fix_auth_tokens.sql
   └─ Ensures secure session token exchange and role reflection in JWT claims.

4. supabase/migrations/20261022000003_milk_stock_and_rate_fix.sql
   └─ Introduces milk stock aggregation logic and dynamic fat lookup improvements.

5. supabase/migrations/20261025000000_remove_kg_use_litres_only.sql
   └─ Enforces strict Litres-only (L) standardization across all tables and constraints.

6. supabase/migrations/20261026000000_update_shift_timings_6am_6pm.sql
   └─ Configures 24/7 continuous 6 AM – 6 PM Morning and 6 PM – 6 AM Evening shift windows.

7. supabase/migrations/20261026_update_database_functions.sql
   └─ Consolidated latest PostgreSQL functions for dashboard, stock, and shift detection.
```

> **Consolidated Seed:** To populate default rates, sample farmers, customers, and test transactions in one step, execute `supabase/complete_seed.sql`.

---

### Default Seed Accounts & Testing

| Account Role | Email Address | Default Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@dairyerp.com` | `admin123456` | Unrestricted full system access |
| **Operator** | `operator@dairyerp.com` | `operator123456` | Daily desk operations, collection & sales |

*Quick login buttons are available on the login page for development and evaluation.*

---

### Frontend Build & Development

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   *Application launches on `http://localhost:5173`.*

3. **Compile production build:**
   ```bash
   npm run build
   ```
   *Runs TypeScript type-checking (`tsc`) followed by Vite optimization, outputting production assets into `/dist`.*

---

## 9. Project Directory Structure

```text
d:/MilkDairyERP/
├── .env                                       # Environment configuration
├── index.html                                 # Single-page application root HTML
├── package.json                               # Dependencies and build scripts
├── tailwind.config.ts                         # Custom dairy palette theme configuration
├── tsconfig.json                              # TypeScript strict configuration
├── vite.config.ts                             # Vite bundler plugins and chunk splitting
│
├── supabase/                                  # Database migrations and seed scripts
│   ├── clean_data.sql                         # Truncates transaction data while keeping credentials
│   ├── complete_seed.sql                      # Master seed script with full test dataset
│   ├── seed.sql                               # Standard seed records
│   ├── seed_users.sql                         # User creation helper script
│   ├── migrations/                            # Versioned SQL migration scripts
│   │   ├── 20261022000000_initial_dairy_schema.sql
│   │   ├── 20261022000001_auth_profile_trigger.sql
│   │   ├── 20261022000002_fix_auth_tokens.sql
│   │   ├── 20261022000003_milk_stock_and_rate_fix.sql
│   │   ├── 20261025000000_remove_kg_use_litres_only.sql
│   │   ├── 20261026000000_update_shift_timings_6am_6pm.sql
│   │   └── 20261026_update_database_functions.sql
│   └── tests/
│       └── business_rules_test.sql            # Automated SQL test suite for ACID validation
│
└── src/
    ├── main.tsx                               # Application bootstrapping
    ├── index.css                              # Tailwind directives & @media print styles
    │
    ├── app/                                   # Application core and routing
    │   ├── App.tsx                            # Root component with providers
    │   ├── router.tsx                         # Protected and role-guarded route definitions
    │   └── providers/
    │       ├── AuthProvider.tsx               # Supabase session, token, and user profile state
    │       └── ShiftProvider.tsx              # Continuous 6 AM - 6 PM shift calculation
    │
    ├── components/                            # Global UI design system
    │   ├── ui/                                # Reusable atoms (Button, Card, Dialog, Badge)
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Dialog.tsx
    │   │   ├── MilkTypeBadge.tsx
    │   │   ├── ShiftBadge.tsx
    │   │   └── StatusBadge.tsx
    │   ├── layout/                            # Layout framing (AppShell, Sidebar, Topbar)
    │   │   ├── AppShell.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── Topbar.tsx
    │   ├── feedback/                          # ConfirmDialog, ErrorState, EmptyState
    │   └── skeletons/                         # DashboardSkeleton, BillSkeleton
    │
    ├── features/                              # Business domain modules
    │   ├── auth/                              # Authentication & login
    │   │   ├── components/LoginForm.tsx
    │   │   ├── hooks/useAuth.ts
    │   │   └── services/authService.ts
    │   │
    │   ├── dashboard/                         # AMCU Operational Dashboard
    │   │   ├── components/DashboardView.tsx   # Header, 4 KPI cards, stock & shift tabs
    │   │   ├── components/MetricCard.tsx      # High-density compact metric cards
    │   │   ├── components/MilkStockCard.tsx   # Visual Cow/Buffalo tanks & flow ledger
    │   │   ├── components/ShiftOperationsSection.tsx # Tabbed shift reconciliation hub
    │   │   ├── components/ShiftCollectionTable.tsx   # Shift procurement table
    │   │   ├── components/ShiftSalesTable.tsx        # Shift sales distribution table
    │   │   ├── hooks/useDashboard.ts
    │   │   └── services/dashboardService.ts
    │   │
    │   ├── milk-collection/                   # Milk intake & farmer pouring
    │   │   ├── components/MilkCollectionForm.tsx
    │   │   ├── components/MilkCollectionHistory.tsx
    │   │   └── services/milkCollectionService.ts
    │   │
    │   ├── milk-sales/                        # Retail milk sales & dispatches
    │   │   ├── components/MilkSalesForm.tsx
    │   │   ├── components/MilkSalesHistory.tsx
    │   │   └── services/milkSalesService.ts
    │   │
    │   ├── stock/                             # Physical stock & silo monitoring
    │   │   ├── components/MilkStockView.tsx
    │   │   └── services/stockService.ts
    │   │
    │   ├── weekly-billing/                    # Settlement & invoice generation
    │   │   ├── components/FarmerBillingView.tsx
    │   │   ├── components/CustomerBillingView.tsx
    │   │   ├── components/BillDetailModal.tsx
    │   │   ├── components/PrintableInvoice.tsx # Official A4 printable tax invoice
    │   │   └── services/weeklyBillingService.ts
    │   │
    │   ├── farmers/                           # Farmer supplier directory & passbooks
    │   ├── customers/                         # Customer buyer directory & passbooks
    │   ├── collection-rates/                  # Tiered fat-based slab rate manager
    │   ├── selling-rates/                     # Fixed retail selling rate manager
    │   ├── settings/                          # Dairy settings & shift window display
    │   └── users/                             # Staff user administration
    │
    ├── lib/                                   # Core utilities and shared helpers
    │   ├── constants.ts                       # Business constants & shift defaults
    │   ├── supabase.ts                        # Supabase client singleton
    │   ├── utils.ts                           # formatCurrency, formatQuantity, amountToWords
    │   └── validation.ts                      # Common validation schemas
    │
    └── types/
        └── database.ts                        # TypeScript interfaces for all database entities
```

---

## 10. Troubleshooting & FAQ

### Q1: Why does the shift change automatically at 6:00 PM without refreshing?
The system utilizes continuous 24/7 automated shift transitions. `ShiftProvider.tsx` runs an active timer synchronized with system clock time in the `Asia/Kolkata` timezone. At precisely `18:00:00` (6:00 PM), the active shift updates from `morning` to `evening` throughout all components, and transactions are stamped authoritatively on the database server.

### Q2: What happens if a farmer brings milk during off-peak hours?
Intake is never rejected due to timing. Any milk received between `06:00:00` and `17:59:59` is recorded under the **Morning Shift**, and milk received between `18:00:00` and `05:59:59` is recorded under the **Evening Shift**.

### Q3: Why is Kilogram (kg) not an option when recording milk?
In accordance with modern dairy cooperative standards, all milk measurement is standardized strictly in **Litres (`L`)**. This eliminates density estimation discrepancies and guarantees 1:1 mathematical parity across collection, storage tanks, retail sales, and billing statements.

### Q4: How do I clean testing transactions without deleting users or login credentials?
Execute [`supabase/clean_data.sql`](file:///d:/MilkDairyERP/supabase/clean_data.sql) in the Supabase SQL Editor. This script safely truncates transaction tables (`milk_collections`, `milk_sales`, `farmer_weekly_bills`, `customer_weekly_bills`, etc.) while strictly preserving the `profiles`, `auth.users`, `farmers`, `customers`, and rate schedules.

### Q5: How do I print clean invoices without browser headers or modal frames?
Open any bill in the billing module and click **Print Invoice**. The system mounts an isolated printable invoice through a React Portal directly to `document.body` and applies `@media print` rules to hide the root application, rendering an official letterhead document with signatures and Indian currency in words.

---

## License

This software is developed for Gokul Dairy Cooperative operations. All rights reserved.
