-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "promoEndsAt" TIMESTAMP(3),
ADD COLUMN     "promoLabel" TEXT,
ADD COLUMN     "promoStartsAt" TIMESTAMP(3);
