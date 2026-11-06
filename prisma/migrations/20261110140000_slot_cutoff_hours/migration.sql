-- Per-slot booking cut-off.
-- NULL = use the mode default (SELF_DRIVE 2h; SHARED/PRIVATE H-1 22:00 WITA).
-- A non-null value N means: bookable until N hours before the departure
-- (e.g. Tubing /08:00 AM with 5 → bookable until 04:00 WITA that day).

ALTER TABLE "SlotTime" ADD COLUMN "cutoffHours" INTEGER;
