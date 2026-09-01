-- CreateEnum
CREATE TYPE "FulfillmentMode" AS ENUM ('SELF_DRIVE', 'PRIVATE_TRANSFER');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MODERATE', 'CHALLENGING');

-- CreateEnum
CREATE TYPE "PickupZoneType" AS ENUM ('UBUD_AREA', 'SOUTH_BALI');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "themeColor" TEXT NOT NULL DEFAULT '#1E40AF',
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaType" "PickupZoneType" NOT NULL,
    "surchargeIdr" INTEGER NOT NULL DEFAULT 0,
    "isCustomQuote" BOOLEAN NOT NULL DEFAULT false,
    "vehicleMaxPax" INTEGER NOT NULL DEFAULT 4,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venture" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT,
    "title" TEXT NOT NULL,
    "hook3Sec" TEXT NOT NULL,
    "shortDescription" TEXT,
    "duration" TEXT NOT NULL,
    "badge" TEXT,
    "highlights" JSONB NOT NULL,
    "inclusions" JSONB NOT NULL,
    "exclusions" JSONB NOT NULL,
    "itinerary" JSONB NOT NULL,
    "essentialInfo" JSONB NOT NULL,
    "faqs" JSONB NOT NULL DEFAULT '[]',
    "languages" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "primaryKeyword" TEXT,
    "secondaryKeywords" JSONB NOT NULL DEFAULT '[]',
    "searchTags" JSONB NOT NULL DEFAULT '[]',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "suitableFor" JSONB NOT NULL DEFAULT '[]',
    "imageUrl" TEXT NOT NULL,
    "gallery" JSONB NOT NULL,
    "videoUrl" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "badge" TEXT,
    "blackoutDates" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceTier" (
    "id" TEXT NOT NULL,
    "minPax" INTEGER NOT NULL,
    "maxPax" INTEGER NOT NULL,
    "pricePerPax" INTEGER NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "PriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotTime" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "currentBookings" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlotTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingDate" TEXT NOT NULL,
    "slotTimeId" TEXT,
    "fulfillmentMode" "FulfillmentMode" NOT NULL,
    "pickupZoneId" TEXT,
    "hotelAddress" TEXT,
    "paxCount" INTEGER NOT NULL,
    "vehicleCount" INTEGER NOT NULL DEFAULT 1,
    "zoneSurchargeIdr" INTEGER NOT NULL DEFAULT 0,
    "selectedAddons" JSONB NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "midtransOrderId" TEXT NOT NULL,
    "snapToken" TEXT,
    "redirectUrl" TEXT,
    "paymentMethod" TEXT,
    "grossAmount" INTEGER NOT NULL,
    "transactionTime" TIMESTAMP(3),
    "rawResponse" JSONB,
    "status" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "qrCodeData" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "redeemedBy" TEXT,
    "status" "VoucherStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "content" TEXT NOT NULL,
    "metaDesc" JSONB NOT NULL,
    "keywords" JSONB NOT NULL,
    "tags" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "ventureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "size" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "ventureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "customerId" TEXT,
    "type" "NotificationType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "Location_name_idx" ON "Location"("name");

-- CreateIndex
CREATE INDEX "Location_region_idx" ON "Location"("region");

-- CreateIndex
CREATE UNIQUE INDEX "PickupZone_name_key" ON "PickupZone"("name");

-- CreateIndex
CREATE INDEX "PickupZone_areaType_idx" ON "PickupZone"("areaType");

-- CreateIndex
CREATE INDEX "PickupZone_isActive_idx" ON "PickupZone"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Venture_slug_key" ON "Venture"("slug");

-- CreateIndex
CREATE INDEX "Venture_tenantId_idx" ON "Venture"("tenantId");

-- CreateIndex
CREATE INDEX "Venture_locationId_idx" ON "Venture"("locationId");

-- CreateIndex
CREATE INDEX "Venture_category_idx" ON "Venture"("category");

-- CreateIndex
CREATE INDEX "Venture_difficulty_idx" ON "Venture"("difficulty");

-- CreateIndex
CREATE INDEX "Venture_rating_idx" ON "Venture"("rating");

-- CreateIndex
CREATE INDEX "Variant_ventureId_idx" ON "Variant"("ventureId");

-- CreateIndex
CREATE INDEX "PriceTier_variantId_idx" ON "PriceTier"("variantId");

-- CreateIndex
CREATE INDEX "SlotTime_variantId_idx" ON "SlotTime"("variantId");

-- CreateIndex
CREATE INDEX "Addon_variantId_idx" ON "Addon"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "Booking_variantId_idx" ON "Booking"("variantId");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_paymentStatus_idx" ON "Booking"("paymentStatus");

-- CreateIndex
CREATE INDEX "Booking_fulfillmentMode_idx" ON "Booking"("fulfillmentMode");

-- CreateIndex
CREATE INDEX "Booking_pickupZoneId_idx" ON "Booking"("pickupZoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_midtransOrderId_idx" ON "Payment"("midtransOrderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Voucher_bookingId_idx" ON "Voucher"("bookingId");

-- CreateIndex
CREATE INDEX "Voucher_status_idx" ON "Voucher"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_ventureId_idx" ON "Article"("ventureId");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE INDEX "Article_aiGenerated_idx" ON "Article"("aiGenerated");

-- CreateIndex
CREATE INDEX "Review_ventureId_isApproved_idx" ON "Review"("ventureId", "isApproved");

-- CreateIndex
CREATE INDEX "Review_customerId_idx" ON "Review"("customerId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "MediaAsset_ventureId_idx" ON "MediaAsset"("ventureId");

-- CreateIndex
CREATE INDEX "MediaAsset_isPrimary_idx" ON "MediaAsset"("isPrimary");

-- CreateIndex
CREATE INDEX "NotificationLog_bookingId_idx" ON "NotificationLog"("bookingId");

-- CreateIndex
CREATE INDEX "NotificationLog_customerId_idx" ON "NotificationLog"("customerId");

-- CreateIndex
CREATE INDEX "NotificationLog_type_idx" ON "NotificationLog"("type");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "NotificationLog"("status");

-- AddForeignKey
ALTER TABLE "Venture" ADD CONSTRAINT "Venture_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venture" ADD CONSTRAINT "Venture_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceTier" ADD CONSTRAINT "PriceTier_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotTime" ADD CONSTRAINT "SlotTime_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_slotTimeId_fkey" FOREIGN KEY ("slotTimeId") REFERENCES "SlotTime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_pickupZoneId_fkey" FOREIGN KEY ("pickupZoneId") REFERENCES "PickupZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
