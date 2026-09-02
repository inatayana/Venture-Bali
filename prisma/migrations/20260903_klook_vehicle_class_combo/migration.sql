-- CreateEnum
CREATE TYPE "VehicleClassType" AS ENUM ('STANDARD_SUV', 'PREMIUM_MPV', 'MINIVAN');

-- AlterEnum
BEGIN;
CREATE TYPE "PickupZoneType_new" AS ENUM ('ZONE_1', 'ZONE_2', 'ZONE_3', 'ZONE_4');
ALTER TABLE "PickupZone" ALTER COLUMN "areaType" TYPE "PickupZoneType_new" USING ("areaType"::text::"PickupZoneType_new");
ALTER TYPE "PickupZoneType" RENAME TO "PickupZoneType_old";
ALTER TYPE "PickupZoneType_new" RENAME TO "PickupZoneType";
DROP TYPE "PickupZoneType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Addon" ADD COLUMN     "isCombo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresTransfer" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "vehicleClassId" TEXT;

-- CreateTable
CREATE TABLE "VehicleClass" (
    "id" TEXT NOT NULL,
    "name" "VehicleClassType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "vehicleMaxPax" INTEGER NOT NULL DEFAULT 4,
    "deltaIdr" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleClass_name_key" ON "VehicleClass"("name");

-- CreateIndex
CREATE INDEX "VehicleClass_isActive_idx" ON "VehicleClass"("isActive");

-- CreateIndex
CREATE INDEX "Booking_vehicleClassId_idx" ON "Booking"("vehicleClassId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

