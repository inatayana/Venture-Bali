-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('FLAT_PER_GUEST', 'AGE_TIERED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "adultsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kidsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "waiverDigitalSignature" TEXT,
ADD COLUMN     "waiverEmergencyContact" JSONB,
ADD COLUMN     "waiverHealthDeclaration" JSONB,
ADD COLUMN     "waiverIdVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "waiverIpAddress" TEXT,
ADD COLUMN     "waiverPhotoId" TEXT,
ADD COLUMN     "waiverSignatureMethod" TEXT,
ADD COLUMN     "waiverSignedAt" TIMESTAMP(3),
ADD COLUMN     "waiverSignedBy" TEXT,
ADD COLUMN     "waiverUserAgent" TEXT,
ADD COLUMN     "youthCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PriceTier" ADD COLUMN     "pricingModel" "PricingModel" NOT NULL DEFAULT 'FLAT_PER_GUEST';
