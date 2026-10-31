-- Legal acceptance & billing details captured at checkout.
--
-- The activity waiver is legally significant for outdoor adventures, so the
-- accepted version and timestamp are stored on the reservation instead of
-- being inferred from the UI.

-- AlterTable
ALTER TABLE "Booking"
    ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
    ADD COLUMN "waiverAcceptedAt" TIMESTAMP(3),
    ADD COLUMN "waiverVersion" TEXT,
    ADD COLUMN "billingAddress" JSONB;
