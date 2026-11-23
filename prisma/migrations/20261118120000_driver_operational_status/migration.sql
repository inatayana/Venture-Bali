-- Add the operational states used by the arrival check-in flow.
-- Additive only: existing rows are unaffected.
ALTER TYPE "BookingLifecycle" ADD VALUE IF NOT EXISTS 'DRIVER_ASSIGNED';
ALTER TYPE "BookingLifecycle" ADD VALUE IF NOT EXISTS 'CHECKED_IN';
-- Driver assignment payload recorded by operations, e.g.
-- { name, phone, vehicle_model, plate_number, assigned_at }.
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "driverInfo" JSONB;
