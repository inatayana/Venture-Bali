-- Restore AGE_TIERED on tiers that were silently flipped back to
-- FLAT_PER_GUEST by the admin variant editor: its server page did not send
-- pricingModel/kids/youth down, so any Save rewrote the tier with the
-- FLAT default. No age-tiered configuration survived that write.
-- Note: zero price values change here (kids/youth stay NULL = adult price).

UPDATE "PriceTier"
SET "pricingModel" = 'AGE_TIERED'
WHERE "pricingModel" = 'FLAT_PER_GUEST';
