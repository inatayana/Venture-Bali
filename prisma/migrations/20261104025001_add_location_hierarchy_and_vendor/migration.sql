-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "desa" TEXT,
ADD COLUMN     "kabupaten" TEXT,
ADD COLUMN     "kecamatan" TEXT,
ADD COLUMN     "provinsi" TEXT NOT NULL DEFAULT 'Bali';

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "vendorId" TEXT;

-- AlterTable
ALTER TABLE "Venture" ADD COLUMN     "meetingPointMapsUrl" TEXT;

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "meetingPoint" TEXT,
    "mapsUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");

-- CreateIndex
CREATE INDEX "Vendor_code_idx" ON "Vendor"("code");

-- CreateIndex
CREATE INDEX "Vendor_activityType_idx" ON "Vendor"("activityType");

-- CreateIndex
CREATE INDEX "Location_kabupaten_idx" ON "Location"("kabupaten");

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
