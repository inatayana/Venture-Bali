-- Split pickup zone pricing by transfer mode.
-- `surchargeIdr` = charter price PER VEHICLE (PRIVATE_TRANSFER: driver + fuel).
-- `surchargePerPaxIdr` (new) = fee PER PERSON (SHARED_TRANSFER shuttle seats).
-- Doc values for shared seats follow BOOKING_ARCHITECTURE §3:
--   Zone 1 core = included (0), Zone 2 = 224.000, Zone 3 = 320.000, Zone 4 = custom quote.

ALTER TABLE "PickupZone" ADD COLUMN "surchargePerPaxIdr" INTEGER NOT NULL DEFAULT 0;

UPDATE "PickupZone"
SET "surchargePerPaxIdr" = CASE
  WHEN "areaType" = 'ZONE_2' THEN 224000
  WHEN "areaType" = 'ZONE_3' THEN 320000
  ELSE 0
END
WHERE "surchargePerPaxIdr" = 0
  AND "areaType" IN ('ZONE_2', 'ZONE_3');
