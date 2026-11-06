-- Uniform age-tiered pricing for EVERY variant tier.
--
-- The owner decision (2026-11-06): one pricing engine everywhere — every
-- package collects guest counts by age band (adults / kids / youth). Kids and
-- youth default to the adult price (NULL columns), so this migration changes
-- zero prices; it only unlocks the age selector uniformly across packages.
-- This pairs with the catalogue seed, which now carries pricingModel:
-- 'AGE_TIERED' for fresh databases, and with the seed's preservation logic
-- (admin-set kids/youth prices are carried forward across reseeds).

UPDATE "PriceTier"
SET "pricingModel" = 'AGE_TIERED'
WHERE "pricingModel" = 'FLAT_PER_GUEST';
