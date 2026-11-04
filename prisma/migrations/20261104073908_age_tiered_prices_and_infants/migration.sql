-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "infantCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PriceTier" ADD COLUMN     "kidsPricePerPax" INTEGER,
ADD COLUMN     "youthPricePerPax" INTEGER;

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "infantEnabled" BOOLEAN NOT NULL DEFAULT false;
