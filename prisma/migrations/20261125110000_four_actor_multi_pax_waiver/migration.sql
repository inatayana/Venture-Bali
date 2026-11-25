-- Phase 2 v1.2.0 — four-actor architecture, per-pax waiver, Field Ops sessions.
-- Additive only: existing bookings keep their legacy BK-<...> codes and booking-level
-- waiver columns; new bookings receive BW-<YYYY>-<XXXX> codes from the application.
-- No payment/vendor/payout column is added or exposed to Customer / Field Ops.

-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('ADULT', 'YOUTH', 'KID', 'INFANT');
CREATE TYPE "FieldOpsRole" AS ENUM ('DRIVER', 'GUIDE', 'SUPERVISOR');

-- CreateTable
CREATE TABLE "BookingParticipant" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "participantType" "ParticipantType" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "email" TEXT,
    "whatsapp" TEXT,
    "waiverVersion" TEXT,
    "waiverSignedAt" TIMESTAMP(3),
    "waiverDigitalSignature" TEXT,
    "waiverSignatureMethod" TEXT,
    "waiverIpAddress" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "dietaryNotes" TEXT,
    "medicalNotes" TEXT,
    "guardianName" TEXT,
    "guardianRelationship" TEXT,
    "guardianConsentAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldOpsUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "FieldOpsRole" NOT NULL DEFAULT 'DRIVER',
    "tenantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldOpsUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldOpsSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldOpsSession_pkey" PRIMARY KEY ("id")
);

-- AlterTable (booking assignment; nullable, no backfill required)
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "fieldOpsUserId" TEXT;

-- CreateIndex
CREATE INDEX "BookingParticipant_bookingId_idx" ON "BookingParticipant"("bookingId");
CREATE INDEX "BookingParticipant_tenantId_idx" ON "BookingParticipant"("tenantId");
CREATE INDEX "BookingParticipant_waiverSignedAt_idx" ON "BookingParticipant"("waiverSignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FieldOpsUser_email_key" ON "FieldOpsUser"("email");
CREATE INDEX "FieldOpsUser_tenantId_idx" ON "FieldOpsUser"("tenantId");
CREATE INDEX "FieldOpsUser_role_idx" ON "FieldOpsUser"("role");

-- CreateIndex
CREATE UNIQUE INDEX "FieldOpsSession_sessionHash_key" ON "FieldOpsSession"("sessionHash");
CREATE INDEX "FieldOpsSession_userId_idx" ON "FieldOpsSession"("userId");
CREATE INDEX "FieldOpsSession_expiresAt_idx" ON "FieldOpsSession"("expiresAt");

-- CreateIndex
CREATE INDEX "Booking_fieldOpsUserId_idx" ON "Booking"("fieldOpsUserId");

-- AddForeignKey
ALTER TABLE "BookingParticipant" ADD CONSTRAINT "BookingParticipant_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingParticipant" ADD CONSTRAINT "BookingParticipant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOpsUser" ADD CONSTRAINT "FieldOpsUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOpsSession" ADD CONSTRAINT "FieldOpsSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "FieldOpsUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_fieldOpsUserId_fkey" FOREIGN KEY ("fieldOpsUserId") REFERENCES "FieldOpsUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
