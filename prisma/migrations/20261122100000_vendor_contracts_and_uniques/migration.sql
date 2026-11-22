-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FIXED_FEE', 'REVENUE_SHARE', 'HYBRID');

-- CreateEnum
CREATE TYPE "PaymentTerms" AS ENUM ('NET_7', 'NET_14', 'NET_30', 'NET_60', 'COD');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('SAFETY', 'SERVICE_QUALITY', 'CANCELLATION', 'NO_SHOW', 'EQUIPMENT_FAILURE', 'WEATHER', 'CUSTOMER_COMPLAINT', 'REGULATORY', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ONBOARDING', 'TERMINATED');


-- DropIndex
DROP INDEX "AdminUser_email_idx";

-- DropIndex
DROP INDEX "Variant_vendorId_idx";


-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "avgRating" DOUBLE PRECISION,
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "cancellationRate" DOUBLE PRECISION,
ADD COLUMN     "cancelledBookings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "commissionType" "CommissionType" DEFAULT 'PERCENTAGE',
ADD COLUMN     "commissionValue" DOUBLE PRECISION,
ADD COLUMN     "completedBookings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "contractDocument" TEXT,
ADD COLUMN     "contractEndDate" TIMESTAMP(3),
ADD COLUMN     "contractStartDate" TIMESTAMP(3),
ADD COLUMN     "contractType" "ContractType" DEFAULT 'FIXED_FEE',
ADD COLUMN     "fixedFeePerPax" INTEGER,
ADD COLUMN     "insuranceExpiry" TIMESTAMP(3),
ADD COLUMN     "lastIncidentDate" TIMESTAMP(3),
ADD COLUMN     "lastPayoutAmount" INTEGER,
ADD COLUMN     "lastPayoutDate" TIMESTAMP(3),
ADD COLUMN     "licenseExpiry" TIMESTAMP(3),
ADD COLUMN     "noShowBookings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "onTimeRate" DOUBLE PRECISION,
ADD COLUMN     "operationsContact" TEXT,
ADD COLUMN     "operationsEmail" TEXT,
ADD COLUMN     "operationsPhone" TEXT,
ADD COLUMN     "paymentTerms" "PaymentTerms" DEFAULT 'NET_14',
ADD COLUMN     "pendingPayout" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revenueSharePct" DOUBLE PRECISION,
ADD COLUMN     "safetyIncidents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slaResponseTimeHours" INTEGER,
ADD COLUMN     "slaUptimePct" DOUBLE PRECISION,
ADD COLUMN     "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "totalBookings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCommission" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalIncidents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalRatingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalRevenue" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "VendorContract" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" "ContractType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "noticePeriod" INTEGER,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayout" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossRevenue" INTEGER NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "commissionAmount" INTEGER NOT NULL,
    "adjustments" INTEGER NOT NULL DEFAULT 0,
    "netAmount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paidBy" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorIncident" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" "IncidentType" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedBy" TEXT,
    "occurredAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPerformanceLog" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "bookingsCount" INTEGER NOT NULL,
    "completedCount" INTEGER NOT NULL,
    "cancelledCount" INTEGER NOT NULL,
    "noShowCount" INTEGER NOT NULL,
    "avgRating" DOUBLE PRECISION,
    "onTimeRate" DOUBLE PRECISION,
    "cancellationRate" DOUBLE PRECISION,
    "incidentCount" INTEGER NOT NULL,
    "revenue" INTEGER NOT NULL,
    "commission" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPerformanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorContract_vendorId_idx" ON "VendorContract"("vendorId");

-- CreateIndex
CREATE INDEX "VendorContract_status_idx" ON "VendorContract"("status");

-- CreateIndex
CREATE INDEX "VendorPayout_vendorId_idx" ON "VendorPayout"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPayout_status_idx" ON "VendorPayout"("status");

-- CreateIndex
CREATE INDEX "VendorPayout_periodStart_periodEnd_idx" ON "VendorPayout"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "VendorIncident_vendorId_idx" ON "VendorIncident"("vendorId");

-- CreateIndex
CREATE INDEX "VendorIncident_bookingId_idx" ON "VendorIncident"("bookingId");

-- CreateIndex
CREATE INDEX "VendorIncident_status_idx" ON "VendorIncident"("status");

-- CreateIndex
CREATE INDEX "VendorIncident_type_idx" ON "VendorIncident"("type");

-- CreateIndex
CREATE INDEX "VendorIncident_severity_idx" ON "VendorIncident"("severity");

-- CreateIndex
CREATE INDEX "VendorPerformanceLog_vendorId_idx" ON "VendorPerformanceLog"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPerformanceLog_periodStart_periodEnd_idx" ON "VendorPerformanceLog"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPerformanceLog_vendorId_periodStart_periodEnd_key" ON "VendorPerformanceLog"("vendorId", "periodStart", "periodEnd");


-- CreateIndex
CREATE UNIQUE INDEX "Payment_midtransOrderId_key" ON "Payment"("midtransOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SlotTime_variantId_time_key" ON "SlotTime"("variantId", "time");

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

-- AddForeignKey
ALTER TABLE "VendorContract" ADD CONSTRAINT "VendorContract_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayout" ADD CONSTRAINT "VendorPayout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorIncident" ADD CONSTRAINT "VendorIncident_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorIncident" ADD CONSTRAINT "VendorIncident_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPerformanceLog" ADD CONSTRAINT "VendorPerformanceLog_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
