-- Restore AGE_TIERED pricing model on every transfer variant's tiers.
--
-- Why: the 2026-11 reseed wiped the admin's AGE_TIERED configuration
-- (age inputs disappeared from Meeting Point / Shared / Private packages),
-- because the catalogue seed data never carried it and the seed deleted the
-- admin columns. This migration puts AGE_TIERED back for Shared and Private
-- Transfer variants only — kids/youth prices stay NULL, which the pricing
-- engine treats as "adult price applies", so zero price change.
--
-- Meeting Point (SELF_DRIVE) variants are deliberately untouched here;
-- the owner decides pricing by age for those separately.

UPDATE "PriceTier"
SET "pricingModel" = 'AGE_TIERED'
WHERE "variantId" IN (
  SELECT "id" FROM "Variant"
  WHERE "fulfillmentMode" IN ('SHARED_TRANSFER', 'PRIVATE_TRANSFER')
)
  AND "pricingModel" = 'FLAT_PER_GUEST';
