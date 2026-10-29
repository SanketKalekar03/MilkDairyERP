-- ====================================================================
-- GOKUL DAIRY ERP: CLEAN ALL INSERTED OPERATIONAL DATA
-- Cleans all farmers, customers, collections, sales, bills, and rate rules.
-- Preserves auth.users, auth.identities, profiles, and dairy_settings.
-- ====================================================================

TRUNCATE TABLE
  public.customer_weekly_bill_items,
  public.customer_weekly_bills,
  public.farmer_weekly_bill_items,
  public.farmer_weekly_bills,
  public.milk_sales,
  public.milk_collections,
  public.customers,
  public.farmers,
  public.collection_rate_rules,
  public.sale_rate_versions,
  public.audit_logs
CASCADE;
