-- Rebrand the tenant record and default theme to BaliWild.
-- Safe to run when both the old and new domains exist: the domain rename is
-- skipped rather than violating the unique index.

ALTER TABLE "Tenant" ALTER COLUMN "themeColor" SET DEFAULT '#000000';

UPDATE "Tenant"
SET "name" = 'BaliWild',
    "themeColor" = '#000000'
WHERE "domain" IN ('baliwild.com', 'venturebali.com', 'venture-bali.com');

UPDATE "Tenant"
SET "domain" = 'baliwild.com'
WHERE "domain" IN ('venturebali.com', 'venture-bali.com')
  AND NOT EXISTS (SELECT 1 FROM "Tenant" WHERE "domain" = 'baliwild.com');
