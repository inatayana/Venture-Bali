-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "pickupZoneId" TEXT;

-- CreateIndex
CREATE INDEX "Variant_pickupZoneId_idx" ON "Variant"("pickupZoneId");

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_pickupZoneId_fkey" FOREIGN KEY ("pickupZoneId") REFERENCES "PickupZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
