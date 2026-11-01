-- Refund, cancellation and reschedule support.

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

DO $$ BEGIN
  CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RefundMethod" AS ENUM ('MIDTRANS', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Booking" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "cancellationReason" TEXT;

CREATE TABLE "Refund" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "amountIdr" INTEGER NOT NULL,
  "feeIdr" INTEGER NOT NULL DEFAULT 0,
  "reason" TEXT,
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
  "method" "RefundMethod" NOT NULL DEFAULT 'MIDTRANS',
  "providerRef" TEXT,
  "notes" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "processedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Refund_bookingId_key" ON "Refund"("bookingId");
CREATE INDEX "Refund_status_idx" ON "Refund"("status");
CREATE INDEX "Refund_requestedAt_idx" ON "Refund"("requestedAt");

ALTER TABLE "Refund"
  ADD CONSTRAINT "Refund_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BookingChange" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "fromDate" TEXT NOT NULL,
  "fromSlot" TEXT,
  "toDate" TEXT NOT NULL,
  "toSlot" TEXT,
  "changedBy" TEXT NOT NULL DEFAULT 'customer',
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingChange_bookingId_createdAt_idx"
  ON "BookingChange"("bookingId", "createdAt");

ALTER TABLE "BookingChange"
  ADD CONSTRAINT "BookingChange_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
