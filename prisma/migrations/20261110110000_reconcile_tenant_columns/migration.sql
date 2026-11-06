-- Reconcile the multi-tenancy rollback left by 20261105063842_add_tenant_id_to_all_models.
--
-- The tenancy foundation migration added a NOT NULL `tenantId` placeholder
-- column (backfilled with 'tenant-001') to EVERY table, but the committed
-- code only carries tenant scope on Venture / Booking / Payment / Review.
-- The remaining NOT NULL columns reject every insert from the current
-- codebase (e.g. Location, Variant, PriceTier, PickupZone).
--
-- This migration drops the unused `tenantId` column from every table that
-- does not declare it in prisma/schema.prisma. Indexes on the column are
-- dropped automatically with it (no foreign keys point at the placeholder
-- columns; the Venture/Booking/Payment/Review columns and
-- Venture_tenantId_fkey stay untouched).
--
-- No data is lost: the dev database was empty apart from the placeholder
-- values. Full tenant isolation remains UNIMPLEMENTED by design and must be
-- threaded through the data layer deliberately before it is documented as
-- complete.

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'tenantId'
      AND table_name NOT IN ('Venture', 'Booking', 'Payment', 'Review')
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP COLUMN "tenantId"', r.table_name);
  END LOOP;
END $$;
