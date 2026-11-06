/*
  Core Multi-Tenancy Migration - Add tenantId to existing tables
  Foreign keys are managed by Prisma schema @relation attributes
*/

-- Step 0: Ensure default tenant exists (idempotent)
INSERT INTO "Tenant" ("id", "domain", "name", "themeColor", "logoUrl", "isActive", "createdAt", "updatedAt")
VALUES ('tenant-001', 'baliwild', 'BaliWild Adventures', '#FFEE00', null, true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Add tenantId column to each table with exception handling for idempotency
DO $$ BEGIN ALTER TABLE "Addon" ADD COLUMN "tenantId" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN UPDATE "Addon" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Addon" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Addon_tenantId_idx" ON "Addon"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "AdminUser" ADD COLUMN "tenantId" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN UPDATE "AdminUser" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; CREATE INDEX IF NOT EXISTS "AdminUser_tenantId_idx" ON "AdminUser"("tenantId"); CREATE INDEX IF NOT EXISTS "AdminUser_email_idx" ON "AdminUser"("email"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "AgentSession" ADD COLUMN "tenantId" TEXT; UPDATE "AgentSession" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "AgentSession" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "AgentSession_tenantId_idx" ON "AgentSession"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "Article" ADD COLUMN "tenantId" TEXT; UPDATE "Article" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Article" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Article_tenantId_idx" ON "Article"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "Booking" ADD COLUMN "tenantId" TEXT; UPDATE "Booking" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Booking" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Booking_tenantId_idx" ON "Booking"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "Coupon" ADD COLUMN "tenantId" TEXT; UPDATE "Coupon" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Coupon" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Coupon_tenantId_idx" ON "Coupon"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "Customer" ADD COLUMN "tenantId" TEXT; UPDATE "Customer" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Customer" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Customer_tenantId_idx" ON "Customer"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "Location" ADD COLUMN "tenantId" TEXT; UPDATE "Location" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Location" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Location_tenantId_idx" ON "Location"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "MediaAsset" ADD COLUMN "tenantId" TEXT; UPDATE "MediaAsset" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "MediaAsset" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "MediaAsset_tenantId_idx" ON "MediaAsset"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "NotificationLog" ADD COLUMN "tenantId" TEXT; UPDATE "NotificationLog" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "NotificationLog" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "NotificationLog_tenantId_idx" ON "NotificationLog"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "Payment" ADD COLUMN "tenantId" TEXT; UPDATE "Payment" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Payment" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Payment_tenantId_idx" ON "Payment"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "PickupZone" ADD COLUMN "tenantId" TEXT; UPDATE "PickupZone" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "PickupZone" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "PickupZone_tenantId_idx" ON "PickupZone"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "PriceTier" ADD COLUMN "tenantId" TEXT; UPDATE "PriceTier" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "PriceTier" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "PriceTier_tenantId_idx" ON "PriceTier"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "Refund" ADD COLUMN "tenantId" TEXT; UPDATE "Refund" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Refund" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Refund_tenantId_idx" ON "Refund"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "Review" ADD COLUMN "tenantId" TEXT; UPDATE "Review" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Review" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Review_tenantId_idx" ON "Review"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "ReviewInvite" ADD COLUMN "tenantId" TEXT; UPDATE "ReviewInvite" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "ReviewInvite" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "ReviewInvite_tenantId_idx" ON "ReviewInvite"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "SlotTime" ADD COLUMN "tenantId" TEXT; UPDATE "SlotTime" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "SlotTime" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "SlotTime_tenantId_idx" ON "SlotTime"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "Variant" ADD COLUMN "tenantId" TEXT; UPDATE "Variant" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Variant" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Variant_tenantId_idx" ON "Variant"("tenantId"); CREATE INDEX IF NOT EXISTS "Variant_vendorId_idx" ON "Variant"("vendorId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "VehicleClass" ADD COLUMN "tenantId" TEXT; UPDATE "VehicleClass" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "VehicleClass" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "VehicleClass_tenantId_idx" ON "VehicleClass"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "Vendor" ADD COLUMN "tenantId" TEXT; UPDATE "Vendor" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Vendor" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Vendor_tenantId_idx" ON "Vendor"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "Voucher" ADD COLUMN "tenantId" TEXT; UPDATE "Voucher" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "Voucher" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "Voucher_tenantId_idx" ON "Voucher"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "BookingChange" ADD COLUMN "tenantId" TEXT; UPDATE "BookingChange" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; ALTER TABLE "BookingChange" ALTER COLUMN "tenantId" SET NOT NULL; CREATE INDEX IF NOT EXISTS "BookingChange_tenantId_idx" ON "BookingChange"("tenantId"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- AdminUser (nullable tenantId for SUPER_ADMIN)
DO $$ BEGIN ALTER TABLE "AdminUser" ADD COLUMN "tenantId" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN UPDATE "AdminUser" SET "tenantId" = 'tenant-001' WHERE "tenantId" IS NULL; CREATE INDEX IF NOT EXISTS "AdminUser_tenantId_idx" ON "AdminUser"("tenantId"); CREATE INDEX IF NOT EXISTS "AdminUser_email_idx" ON "AdminUser"("email"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Step 1: Ensure default tenant exists (idempotent)
INSERT INTO "Tenant" ("id", "domain", "name", "themeColor", "logoUrl", "isActive", "createdAt", "updatedAt")
VALUES ('tenant-001', 'baliwild', 'BaliWild Adventures', '#FFEE00', null, true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Step 2: Add config column to Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "config" JSONB;

-- Step 3: AdminUser indexes
CREATE INDEX IF NOT EXISTS "AdminUser_email_idx" ON "AdminUser"("email");
CREATE INDEX IF NOT EXISTS "AdminUser_tenantId_idx" ON "AdminUser"("tenantId");