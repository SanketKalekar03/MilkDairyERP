# Dairy Milk Collection & Sales Management System

A production-ready, backend-authoritative web application for dairy cooperative operations, managing morning/evening milk collections from farmers, milk sales to customers in litres, dynamic fat-based collection rates, fixed selling rates, automated shift detection, and weekly atomic billing.

---

## Architecture Overview

This application enforces a strict backend-authoritative architecture:

```text
React (Client-Side UI / Validation / Zod)
   |
   | Supabase Auth (JWT)
   |
   v
Supabase Edge Functions / Authenticated RPC
   |
   | Session & Role Authorization, Request Validation
   |
   v
PostgreSQL Functions (SECURITY DEFINER / ACID Transactions)
   |
   | Rate Lookup, Shift Determination, Financial Rounding, Weekly Aggregation
   |
   v
PostgreSQL Tables
   |
   +--> Constraints (CHECK, UNIQUE, FOREIGN KEY)
   +--> Triggers (Immutability, Finalization Protection, Timestamps)
   +--> Indexes (Optimized for operational lookups)
   +--> Row Level Security (RLS)
```

---

## Color Palette & Design System

The UI follows the strict corporate dairy palette:

- **Navy (`#2F4156`)**: Primary navigation, sidebar, main headings, strong text, active nav states.
- **Teal (`#567C8D`)**: Secondary actions, section headings, icons, data highlights.
- **Sky Blue (`#C8D9E6`)**: Subtle backgrounds, selected states, cards, table highlights.
- **Beige (`#F5EFEB`)**: Warm page background, secondary surfaces, empty-state backgrounds.
- **White (`#FFFFFF`)**: Main cards, forms, tables, dialog surfaces.

---

## Core Features & Business Rules

1. **Dual Roles**:
   - **Admin**: Full access including rate management, shift timings, user administration, billing.
   - **Operator**: Daily operations (collecting milk, recording sales, managing farmers/customers, viewing/drafting bills). Strictly blocked by RLS and database triggers from changing rates, shift timings, or elevating roles.

2. **Automated Shift Detection**:
   - Morning & Evening shifts are authoritatively computed on the database server based on current time + dairy timezone (`Asia/Kolkata`) + configured shift windows.
   - Frontend shift display is informational only; transactions are stamped authoritatively on save.

3. **Milk Collection**:
   - Supports Cow and Buffalo milk.
   - Supports Kilograms (kg) and Litres (L) measurement.
   - Rates are determined dynamically by fat percentage ranges from effective-dated rate rules.
   - Historical transactions permanently preserve their `applied_rate` and `amount`.

4. **Milk Sales**:
   - Measured strictly in Litres.
   - Separate selling rates for Cow and Buffalo milk.
   - Independent from collection rates and fat percentages.

5. **Weekly Billing**:
   - **Farmer Weekly Bills**: Aggregates unbilled collections over any 7-day or custom period.
   - **Customer Weekly Bills**: Aggregates unbilled sales over the billing period.
   - **Duplicate Protection**: Unique constraints prevent one collection or sale from belonging to multiple finalized bills.
   - **Integrity Triggers**: Prevent modification or deletion of transactions attached to finalized bills.

---

## Project Structure

```text
├── supabase/
│   ├── migrations/
│   │   └── 20261022000000_initial_dairy_schema.sql  # Normalized schema, functions, triggers, RLS
│   ├── seed.sql                                     # Seed rates, dairy settings, farmers, customers
│   ├── tests/
│   │   └── business_rules_test.sql                  # Comprehensive SQL test suite
│   ├── functions/                                   # 7 Deno/TypeScript Supabase Edge Functions
│   │   ├── _shared/
│   │   ├── record-collection/
│   │   ├── record-sale/
│   │   ├── generate-farmer-bill/
│   │   ├── generate-customer-bill/
│   │   ├── finalize-farmer-bill/
│   │   ├── finalize-customer-bill/
│   │   └── get-dashboard/
│   └── config.toml
│
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers/
│   │       ├── AuthProvider.tsx
│   │       └── ShiftProvider.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── skeletons/
│   │   └── feedback/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── farmers/
│   │   ├── customers/
│   │   ├── collection-rates/
│   │   ├── selling-rates/
│   │   ├── milk-collection/
│   │   ├── milk-sales/
│   │   ├── weekly-billing/
│   │   ├── users/
│   │   └── settings/
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   └── types/
│       └── database.ts
│
├── .env
├── .env.example
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## Setup & Running

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Apply Database Schema & Seed Data

In Supabase Dashboard SQL Editor, run:
1. `supabase/migrations/20261022000000_initial_dairy_schema.sql`
2. `supabase/seed.sql`

To verify all business rules, run:
3. `supabase/tests/business_rules_test.sql`

### 3. Install & Start Frontend

```bash
npm install --legacy-peer-deps
npm run dev
```

### 4. Build for Production

```bash
npm run build
```
