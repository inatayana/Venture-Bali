-- Owner decision 2026-10-31: booking modes expand from two to three:
--   SELF_DRIVE (default), SHARED_TRANSFER (new), PRIVATE_TRANSFER.
-- The "Shared Transfer" variant needs its own fulfillment mode so the
-- pricing engine can charge a per-pax shuttle fee instead of a per-vehicle
-- private-car fee. Guardrails updated in AGENTS.md §9 and
-- docs/BOOKING_ARCHITECTURE.md.

-- AlterEnum
ALTER TYPE "FulfillmentMode" ADD VALUE 'SHARED_TRANSFER';
