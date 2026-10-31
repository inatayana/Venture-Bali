-- Hybrid checkout: temporary inventory holds, operational lifecycle and the
-- field-team job order.
--
-- The previous implementation inferred the 15-minute hold from `createdAt` and
-- never expired the payment session, so a stale PENDING booking could still be
-- paid after its slot had been resold. `expiresAt` makes the hold explicit and
-- lets the reaper cron cancel it.

-- CreateEnum
CREATE TYPE "BookingLifecycle" AS ENUM ('AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- AlterTable
ALTER TABLE "Booking"
    ADD COLUMN "lifecycleStatus" "BookingLifecycle" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    ADD COLUMN "expiresAt" TIMESTAMP(3);

-- Backfill: paid bookings are confirmed, pending ones keep a hold derived from
-- their creation time (10 minutes, matching BOOKING_HOLD_MINUTES).
UPDATE "Booking" SET "lifecycleStatus" = 'CONFIRMED' WHERE "paymentStatus" = 'PAID';
UPDATE "Booking"
   SET "expiresAt" = "createdAt" + interval '10 minutes'
 WHERE "paymentStatus" = 'PENDING';

-- CreateIndex
CREATE INDEX "Booking_bookingDate_lifecycleStatus_idx" ON "Booking"("bookingDate", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "Booking_paymentStatus_expiresAt_idx" ON "Booking"("paymentStatus", "expiresAt");
