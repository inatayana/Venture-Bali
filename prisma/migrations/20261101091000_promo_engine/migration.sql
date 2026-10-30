-- Promo & coupon engine for the interactive booking configurator.
--
-- Variant gains a per-variant duration, transport badge, promo price,
-- operational notes and its own fulfillment mode (Meeting Point / Shared /
-- Private / Bundle are variants, not separate SKUs).
--
-- Coupon is a first-class table so codes can be validated server-side.
-- Booking snapshots the discount and surcharge so every reservation stays
-- auditable even after a promo ends.

-- AlterTable
ALTER TABLE "Variant"
    ADD COLUMN "transportBadge" TEXT,
    ADD COLUMN "duration" TEXT,
    ADD COLUMN "fulfillmentMode" "FulfillmentMode" NOT NULL DEFAULT 'SELF_DRIVE',
    ADD COLUMN "promoPriceIdr" INTEGER,
    ADD COLUMN "operationNotes" TEXT,
    ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "minPax" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_isActive_idx" ON "Coupon"("isActive");

-- AlterTable
ALTER TABLE "Booking"
    ADD COLUMN "isTba" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "nightSurchargeIdr" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "discountIdr" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "appliedCouponCode" TEXT;

-- Backfill existing rows: variants sold as private transfer keep their mode.
UPDATE "Variant"
   SET "fulfillmentMode" = 'PRIVATE_TRANSFER'
 WHERE "title" ILIKE '%private transfer%';

