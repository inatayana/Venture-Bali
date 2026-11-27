-- 2026-11-27: Booking Table Partitioning by Month (bookingDate)
-- Author: Senior Product & Database Architect
-- References: STRATEGY_20YEAR_ROADMAP.md §5.1 Quick Wins #3
-- 
-- IMPORTANT: This migration requires careful execution.
-- 1. Run during low-traffic window
-- 2. Test on staging first
-- 3. Requires downtime or pg_partman for zero-downtime (see notes)
-- 4. All foreign keys to Booking must be recreated

-- ============================================================================
-- PART 1: Create Partitioned Booking Table (New Structure)
-- ============================================================================

-- Create the partitioned parent table
CREATE TABLE "Booking_partitioned" (
    "id" TEXT NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingDate" TEXT NOT NULL,  -- Keep as TEXT for partition key (YYYY-MM-DD)
    "slotTimeId" TEXT,
    "fulfillmentMode" "FulfillmentMode" NOT NULL,
    "pickupZoneId" TEXT,
    "hotelAddress" TEXT,
    "paxCount" INTEGER NOT NULL,
    "vehicleCount" INTEGER NOT NULL DEFAULT 1,
    "zoneSurchargeIdr" INTEGER NOT NULL DEFAULT 0,
    "selectedAddons" JSONB,
    "totalPrice" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vehicleClassId" TEXT,
    "isTba" BOOLEAN NOT NULL DEFAULT false,
    "nightSurchargeIdr" INTEGER NOT NULL DEFAULT 0,
    "discountIdr" INTEGER NOT NULL DEFAULT 0,
    "appliedCouponCode" TEXT,
    "lifecycleStatus" "BookingLifecycle" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "expiresAt" TIMESTAMP(3),
    "termsAcceptedAt" TIMESTAMP(3),
    "waiverAcceptedAt" TIMESTAMP(3),
    "waiverVersion" TEXT,
    "billingAddress" JSONB,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "adultsCount" INTEGER NOT NULL DEFAULT 0,
    "kidsCount" INTEGER NOT NULL DEFAULT 0,
    "waiverDigitalSignature" TEXT,
    "waiverEmergencyContact" JSONB,
    "waiverHealthDeclaration" JSONB,
    "waiverIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "waiverIpAddress" TEXT,
    "waiverPhotoId" TEXT,
    "waiverSignatureMethod" TEXT,
    "waiverSignedAt" TIMESTAMP(3),
    "waiverSignedBy" TEXT,
    "waiverUserAgent" TEXT,
    "youthCount" INTEGER NOT NULL DEFAULT 0,
    "infantCount" INTEGER NOT NULL DEFAULT 0,
    "driverInfo" JSONB,
    "tenantId" TEXT NOT NULL,
    PRIMARY KEY ("id", "bookingDate")  -- Composite PK required for partitioning
) PARTITION BY RANGE ("bookingDate");

-- Create monthly partitions (2024-2026 historical + 2027 future)
-- Format: booking_YYYY_MM

-- Historical partitions
CREATE TABLE "booking_2024_01" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE "booking_2024_02" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE "booking_2024_03" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE "booking_2024_04" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE "booking_2024_05" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE "booking_2024_06" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE "booking_2024_07" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE "booking_2024_08" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE "booking_2024_09" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE "booking_2024_10" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE "booking_2024_11" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE "booking_2024_12" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE "booking_2025_01" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE "booking_2025_02" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE "booking_2025_03" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE "booking_2025_04" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE "booking_2025_05" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE "booking_2025_06" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE "booking_2025_07" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE "booking_2025_08" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE "booking_2025_09" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE "booking_2025_10" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE "booking_2025_11" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE "booking_2025_12" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Current year (2026)
CREATE TABLE "booking_2026_01" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE "booking_2026_02" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE "booking_2026_03" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE "booking_2026_04" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE "booking_2026_05" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE "booking_2026_06" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE "booking_2026_07" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE "booking_2026_08" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE "booking_2026_09" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE "booking_2026_10" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE "booking_2026_11" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE "booking_2026_12" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Future partitions (auto-create via pg_partman or manual)
CREATE TABLE "booking_2027_01" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE "booking_2027_02" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');
CREATE TABLE "booking_2027_03" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');
CREATE TABLE "booking_2027_04" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-04-01') TO ('2027-05-01');
CREATE TABLE "booking_2027_05" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-05-01') TO ('2027-06-01');
CREATE TABLE "booking_2027_06" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-06-01') TO ('2027-07-01');
CREATE TABLE "booking_2027_07" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-07-01') TO ('2027-08-01');
CREATE TABLE "booking_2027_08" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-08-01') TO ('2027-09-01');
CREATE TABLE "booking_2027_09" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-09-01') TO ('2027-10-01');
CREATE TABLE "booking_2027_10" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-10-01') TO ('2027-11-01');
CREATE TABLE "booking_2027_11" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-11-01') TO ('2027-12-01');
CREATE TABLE "booking_2027_12" PARTITION OF "Booking_partitioned" FOR VALUES FROM ('2027-12-01') TO ('2028-01-01');

-- Default partition for any out-of-range dates
CREATE TABLE "booking_default" PARTITION OF "Booking_partitioned" DEFAULT;

-- ============================================================================
-- PART 2: Create Indexes on Partitioned Table (auto-propagated to partitions)
-- ============================================================================

-- Unique constraints (must include partition key)
CREATE UNIQUE INDEX "Booking_partitioned_bookingCode_key" ON "Booking_partitioned" ("bookingCode", "bookingDate");
CREATE UNIQUE INDEX "Booking_partitioned_id_bookingDate_key" ON "Booking_partitioned" ("id", "bookingDate");

-- Regular indexes (auto-created on each partition)
CREATE INDEX "Booking_partitioned_variantId_idx" ON "Booking_partitioned" ("variantId");
CREATE INDEX "Booking_partitioned_customerId_idx" ON "Booking_partitioned" ("customerId");
CREATE INDEX "Booking_partitioned_paymentStatus_idx" ON "Booking_partitioned" ("paymentStatus");
CREATE INDEX "Booking_partitioned_fulfillmentMode_idx" ON "Booking_partitioned" ("fulfillmentMode");
CREATE INDEX "Booking_partitioned_pickupZoneId_idx" ON "Booking_partitioned" ("pickupZoneId");
CREATE INDEX "Booking_partitioned_vehicleClassId_idx" ON "Booking_partitioned" ("vehicleClassId");
CREATE INDEX "Booking_partitioned_bookingDate_lifecycleStatus_idx" ON "Booking_partitioned" ("bookingDate", "lifecycleStatus");
CREATE INDEX "Booking_partitioned_paymentStatus_expiresAt_idx" ON "Booking_partitioned" ("paymentStatus", "expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX "Booking_partitioned_tenantId_idx" ON "Booking_partitioned" ("tenantId");

-- ============================================================================
-- PART 3: Foreign Key Constraints (must be added after data migration)
-- ============================================================================
-- Note: FKs on partitioned tables require the referenced table to also be partitioned
-- or the FK must be declared on each partition individually.
-- For simplicity, we'll use triggers for referential integrity (see Part 5).

-- ============================================================================
-- PART 4: Data Migration (Run in Transaction - Requires Downtime)
-- ============================================================================
-- 
-- BEGIN;
-- 
-- -- 1. Lock the original table
-- LOCK TABLE "Booking" IN ACCESS EXCLUSIVE MODE;
-- 
-- -- 2. Insert data into partitioned table
-- INSERT INTO "Booking_partitioned" 
-- SELECT * FROM "Booking";
-- 
-- -- 3. Verify row counts
-- SELECT count(*) FROM "Booking";
-- SELECT count(*) FROM "Booking_partitioned";
-- 
-- -- 4. Swap tables (rename)
-- ALTER TABLE "Booking" RENAME TO "Booking_old";
-- ALTER TABLE "Booking_partitioned" RENAME TO "Booking";
-- 
-- -- 5. Recreate sequences, triggers, etc.
-- COMMIT;

-- ============================================================================
-- PART 5: Referential Integrity via Triggers (Alternative to FKs)
-- ============================================================================
-- Since partitioned tables don't support FKs to non-partitioned tables cleanly,
-- we use triggers for referential integrity.

-- Trigger function for variantId -> Variant
CREATE OR REPLACE FUNCTION check_booking_variant_fk()
RETURNS trigger AS $$
BEGIN
    IF NEW."variantId" IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM "Variant" WHERE "id" = NEW."variantId") THEN
            RAISE EXCEPTION 'Foreign key violation: Variant % not found', NEW."variantId";
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to each partition (automatically via parent)
CREATE TRIGGER booking_variant_fk
    BEFORE INSERT OR UPDATE ON "Booking_partitioned"
    FOR EACH ROW EXECUTE FUNCTION check_booking_variant_fk();

-- Trigger for customerId -> Customer
CREATE OR REPLACE FUNCTION check_booking_customer_fk()
RETURNS trigger AS $$
BEGIN
    IF NEW."customerId" IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM "Customer" WHERE "id" = NEW."customerId") THEN
            RAISE EXCEPTION 'Foreign key violation: Customer % not found', NEW."customerId";
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_customer_fk
    BEFORE INSERT OR UPDATE ON "Booking_partitioned"
    FOR EACH ROW EXECUTE FUNCTION check_booking_customer_fk();

-- Trigger for tenantId -> Tenant
CREATE OR REPLACE FUNCTION check_booking_tenant_fk()
RETURNS trigger AS $$
BEGIN
    IF NEW."tenantId" IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM "Tenant" WHERE "id" = NEW."tenantId") THEN
            RAISE EXCEPTION 'Foreign key violation: Tenant % not found', NEW."tenantId";
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_tenant_fk
    BEFORE INSERT OR UPDATE ON "Booking_partitioned"
    FOR EACH ROW EXECUTE FUNCTION check_booking_tenant_fk();

-- Trigger for slotTimeId -> SlotTime
CREATE OR REPLACE FUNCTION check_booking_slot_time_fk()
RETURNS trigger AS $$
BEGIN
    IF NEW."slotTimeId" IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM "SlotTime" WHERE "id" = NEW."slotTimeId") THEN
            RAISE EXCEPTION 'Foreign key violation: SlotTime % not found', NEW."slotTimeId";
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_slot_time_fk
    BEFORE INSERT OR UPDATE ON "Booking_partitioned"
    FOR EACH ROW EXECUTE FUNCTION check_booking_slot_time_fk();

-- Trigger for pickupZoneId -> PickupZone
CREATE OR REPLACE FUNCTION check_booking_pickup_zone_fk()
RETURNS trigger AS $$
BEGIN
    IF NEW."pickupZoneId" IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM "PickupZone" WHERE "id" = NEW."pickupZoneId") THEN
            RAISE EXCEPTION 'Foreign key violation: PickupZone % not found', NEW."pickupZoneId";
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_pickup_zone_fk
    BEFORE INSERT OR UPDATE ON "Booking_partitioned"
    FOR EACH ROW EXECUTE FUNCTION check_booking_pickup_zone_fk();

-- Trigger for vehicleClassId -> VehicleClass
CREATE OR REPLACE FUNCTION check_booking_vehicle_class_fk()
RETURNS trigger AS $$
BEGIN
    IF NEW."vehicleClassId" IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM "VehicleClass" WHERE "id" = NEW."vehicleClassId") THEN
            RAISE EXCEPTION 'Foreign key violation: VehicleClass % not found', NEW."vehicleClassId";
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_vehicle_class_fk
    BEFORE INSERT OR UPDATE ON "Booking_partitioned"
    FOR EACH ROW EXECUTE FUNCTION check_booking_vehicle_class_fk();

-- Trigger for appliedCouponCode -> Coupon
CREATE OR REPLACE FUNCTION check_booking_coupon_fk()
RETURNS trigger AS $$
BEGIN
    IF NEW."appliedCouponCode" IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM "Coupon" WHERE "code" = NEW."appliedCouponCode") THEN
            RAISE EXCEPTION 'Foreign key violation: Coupon % not found', NEW."appliedCouponCode";
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_coupon_fk
    BEFORE INSERT OR UPDATE ON "Booking_partitioned"
    FOR EACH ROW EXECUTE FUNCTION check_booking_coupon_fk();

-- ============================================================================
-- PART 6: Maintenance Function (Auto-create Future Partitions)
-- ============================================================================
-- This function should be run monthly via pg_cron or external scheduler

CREATE OR REPLACE FUNCTION create_next_month_booking_partition()
RETURNS void AS $$
DECLARE
    next_month_start DATE;
    next_month_end DATE;
    partition_name TEXT;
BEGIN
    next_month_start := date_trunc('month', CURRENT_DATE + INTERVAL '1 month')::DATE;
    next_month_end := next_month_start + INTERVAL '1 month';
    partition_name := 'booking_' || to_char(next_month_start, 'YYYY_MM');
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF "Booking" FOR VALUES FROM (%L) TO (%L)',
        partition_name, next_month_start, next_month_end
    );
    
    RAISE NOTICE 'Created partition % for % to %', partition_name, next_month_start, next_month_end;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to application role
GRANT EXECUTE ON FUNCTION create_next_month_booking_partition() TO postgres;

-- ============================================================================
-- PART 7: pg_cron Job (If pg_cron extension available)
-- ============================================================================
-- SELECT cron.schedule('create-booking-partition-monthly', '0 0 1 * *', 'SELECT create_next_month_booking_partition();');

-- ============================================================================
-- PART 8: Cleanup Old Partitions (Retention Policy - 7 Years)
-- ============================================================================
-- Run annually to drop partitions older than 7 years

CREATE OR REPLACE FUNCTION drop_old_booking_partitions()
RETURNS void AS $$
DECLARE
    cutoff_date DATE := CURRENT_DATE - INTERVAL '7 years';
    partition_record RECORD;
BEGIN
    FOR partition_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE tablename LIKE 'booking_%' AND tablename NOT LIKE 'booking_default'
    LOOP
        -- Extract date from partition name (booking_YYYY_MM)
        DECLARE
            partition_date TEXT := substring(partition_record.tablename FROM 'booking_(\d{4}_\d{2})');
            partition_start DATE;
        BEGIN
            partition_start := to_date(partition_date || '_01', 'YYYY_MM_DD');
            IF partition_start < cutoff_date THEN
                EXECUTE format('DROP TABLE %I.%I', partition_record.schemaname, partition_record.tablename);
                RAISE NOTICE 'Dropped old partition %', partition_record.tablename;
            END IF;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NOTES FOR EXECUTION
-- ============================================================================
/*
EXECUTION ORDER:
1. Run this migration on staging first
2. Verify all partitions created correctly
3. Test data migration with copy of production data
4. Schedule production run during maintenance window
5. Steps:
   a. Enable maintenance mode / read-only
   b. Run data migration (Part 4) - may take minutes for large tables
   c. Verify row counts match
   d. Update Prisma schema to reflect new table name (if renamed)
   e. Deploy application code
   f. Disable maintenance mode
6. Monitor query performance for 24-48 hours
7. Drop Booking_old after verification period

ALTERNATIVE: Zero-Downtime with pg_partman
- Install pg_partman extension
- Use partman.create_parent() for automated partition management
- Use partman.run_maintenance() for partition creation/dropping
- Requires Supabase support for pg_partman (check availability)

PRISMA SCHEMA UPDATE:
After migration, update prisma/schema.prisma:
- Booking model: @@id([id, bookingDate]) // Composite primary key
- All relations to Booking: adjust foreign key references
- Run prisma generate && prisma migrate dev --name sync_partitioned_booking
*/