-- 2026-11-27: Supabase Row Level Security (RLS) Policies
-- Author: Senior Product & Database Architect
-- References: STRATEGY_20YEAR_ROADMAP.md §5.1 Quick Wins #1
-- TECH_DECISION_LOG.md §7 (RLS Decision)
--
-- IMPORTANT: Run these in Supabase SQL Editor AFTER enabling RLS on tables
-- Enable RLS: ALTER TABLE "TableName" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONTEXT: Multi-tenancy via Tenant model
-- Current: Single tenant (BaliWild) — policies written for future multi-tenant
-- Auth: Supabase Auth (JWT) → auth.uid() = user ID
-- Tenant context: Set via SET LOCAL app.current_tenant_id = '...' in middleware
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current tenant from session (set by middleware)
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true);
EXCEPTION
  WHEN undefined_object THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get current user ID from auth
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid()::UUID;
EXCEPTION
  WHEN undefined_object THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user is admin (via AdminUser table)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM "AdminUser" 
    WHERE "id" = current_user_id() 
    AND "isActive" = true 
    AND "role" IN ('SUPER_ADMIN', 'ADMIN')
  ) INTO result;
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user is staff (admin + editor)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM "AdminUser" 
    WHERE "id" = current_user_id() 
    AND "isActive" = true 
    AND "role" IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  ) INTO result;
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TENANT POLICIES
-- ============================================================================

-- Tenant: Admins can manage their tenant
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_admin_select" ON "Tenant"
  FOR SELECT TO authenticated
  USING (
    "id" = current_tenant_id() 
    AND is_admin()
  );

CREATE POLICY "tenant_admin_update" ON "Tenant"
  FOR UPDATE TO authenticated
  USING (
    "id" = current_tenant_id() 
    AND is_admin()
  )
  WITH CHECK (
    "id" = current_tenant_id() 
    AND is_admin()
  );

-- ============================================================================
-- ADMIN USER POLICIES
-- ============================================================================

ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_self_select" ON "AdminUser"
  FOR SELECT TO authenticated
  USING ("id" = current_user_id());

CREATE POLICY "admin_super_select_all" ON "AdminUser"
  FOR SELECT TO authenticated
  USING (is_admin() AND current_tenant_id() IS NOT NULL);

CREATE POLICY "admin_super_insert" ON "AdminUser"
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() AND "tenantId" = current_tenant_id());

CREATE POLICY "admin_super_update" ON "AdminUser"
  FOR UPDATE TO authenticated
  USING (is_admin() AND "tenantId" = current_tenant_id())
  WITH CHECK (is_admin() AND "tenantId" = current_tenant_id());

-- ============================================================================
-- VENTURE (PRODUCT) POLICIES
-- ============================================================================

ALTER TABLE "Venture" ENABLE ROW LEVEL SECURITY;

-- Public read for published ventures (tenant-scoped)
CREATE POLICY "venture_public_select" ON "Venture"
  FOR SELECT TO anon, authenticated
  USING ("tenantId" = current_tenant_id());

-- Staff full access within tenant
CREATE POLICY "venture_staff_all" ON "Venture"
  FOR ALL TO authenticated
  USING ("tenantId" = current_tenant_id() AND is_staff())
  WITH CHECK ("tenantId" = current_tenant_id() AND is_staff());

-- ============================================================================
-- VARIANT POLICIES
-- ============================================================================

ALTER TABLE "Variant" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variant_public_select" ON "Variant"
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Venture" v 
      WHERE v."id" = "Variant"."ventureId" 
      AND v."tenantId" = current_tenant_id()
    )
  );

CREATE POLICY "variant_staff_all" ON "Variant"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Venture" v 
      WHERE v."id" = "Variant"."ventureId" 
      AND v."tenantId" = current_tenant_id()
      AND is_staff()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Venture" v 
      WHERE v."id" = "Variant"."ventureId" 
      AND v."tenantId" = current_tenant_id()
      AND is_staff()
    )
  );

-- ============================================================================
-- PRICING POLICIES (PriceTier, SlotTime, Addon, PickupZone, VehicleClass)
-- ============================================================================

ALTER TABLE "PriceTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SlotTime" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Addon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PickupZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VehicleClass" ENABLE ROW LEVEL SECURITY;

-- Public read (tenant-scoped via venture/variant)
CREATE POLICY "pricing_public_select" ON "PriceTier"
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Variant" v
      JOIN "Venture" ve ON ve."id" = v."ventureId"
      WHERE v."id" = "PriceTier"."variantId"
      AND ve."tenantId" = current_tenant_id()
    )
  );

CREATE POLICY "slot_time_public_select" ON "SlotTime"
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Variant" v
      JOIN "Venture" ve ON ve."id" = v."ventureId"
      WHERE v."id" = "SlotTime"."variantId"
      AND ve."tenantId" = current_tenant_id()
    )
  );

CREATE POLICY "addon_public_select" ON "Addon"
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Variant" v
      JOIN "Venture" ve ON ve."id" = v."ventureId"
      WHERE v."id" = "Addon"."variantId"
      AND ve."tenantId" = current_tenant_id()
    )
  );

CREATE POLICY "pickup_zone_public_select" ON "PickupZone"
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true AND current_tenant_id() IS NOT NULL);

CREATE POLICY "vehicle_class_public_select" ON "VehicleClass"
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true AND current_tenant_id() IS NOT NULL);

-- Staff write
CREATE POLICY "pricing_staff_all" ON "PriceTier"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Variant" v
      JOIN "Venture" ve ON ve."id" = v."ventureId"
      WHERE v."id" = "PriceTier"."variantId"
      AND ve."tenantId" = current_tenant_id()
      AND is_staff()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Variant" v
      JOIN "Venture" ve ON ve."id" = v."ventureId"
      WHERE v."id" = "PriceTier"."variantId"
      AND ve."tenantId" = current_tenant_id()
      AND is_staff()
    )
  );

-- Repeat for SlotTime, Addon (similar pattern)
CREATE POLICY "slot_time_staff_all" ON "SlotTime"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Variant" v
      JOIN "Venture" ve ON ve."id" = v."ventureId"
      WHERE v."id" = "SlotTime"."variantId"
      AND ve."tenantId" = current_tenant_id()
      AND is_staff()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Variant" v
      JOIN "Venture" ve ON ve."id" = v."ventureId"
      WHERE v."id" = "SlotTime"."variantId"
      AND ve."tenantId" = current_tenant_id()
      AND is_staff()
    )
  );

CREATE POLICY "addon_staff_all" ON "Addon"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Variant" v
      JOIN "Venture" ve ON ve."id" = v."ventureId"
      WHERE v."id" = "Addon"."variantId"
      AND ve."tenantId" = current_tenant_id()
      AND is_staff()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Variant" v
      JOIN "Venture" ve ON ve."id" = v."ventureId"
      WHERE v."id" = "Addon"."variantId"
      AND ve."tenantId" = current_tenant_id()
      AND is_staff()
    )
  );

CREATE POLICY "pickup_zone_staff_all" ON "PickupZone"
  FOR ALL TO authenticated
  USING (current_tenant_id() IS NOT NULL AND is_staff())
  WITH CHECK (current_tenant_id() IS NOT NULL AND is_staff());

CREATE POLICY "vehicle_class_staff_all" ON "VehicleClass"
  FOR ALL TO authenticated
  USING (current_tenant_id() IS NOT NULL AND is_staff())
  WITH CHECK (current_tenant_id() IS NOT NULL AND is_staff());

-- ============================================================================
-- BOOKING POLICIES
-- ============================================================================

ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;

-- Customer: read own bookings
CREATE POLICY "booking_customer_select" ON "Booking"
  FOR SELECT TO authenticated
  USING (
    "customerId" IN (
      SELECT "id" FROM "Customer" WHERE "email" = auth.email()
    )
    AND "tenantId" = current_tenant_id()
  );

-- Customer: create booking (via checkout flow)
CREATE POLICY "booking_customer_insert" ON "Booking"
  FOR INSERT TO authenticated, anon
  WITH CHECK ("tenantId" = current_tenant_id());

-- Staff: full access within tenant
CREATE POLICY "booking_staff_all" ON "Booking"
  FOR ALL TO authenticated
  USING ("tenantId" = current_tenant_id() AND is_staff())
  WITH CHECK ("tenantId" = current_tenant_id() AND is_staff());

-- Vendor: read assigned bookings (future marketplace)
CREATE POLICY "booking_vendor_select" ON "Booking"
  FOR SELECT TO authenticated
  USING (
    "variantId" IN (
      SELECT "id" FROM "Variant" WHERE "vendorId" = current_user_id()::TEXT
    )
    AND "tenantId" = current_tenant_id()
  );

-- ============================================================================
-- CUSTOMER POLICIES
-- ============================================================================

ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;

-- Self read/update
CREATE POLICY "customer_self_select" ON "Customer"
  FOR SELECT TO authenticated
  USING ("email" = auth.email() AND "tenantId" = current_tenant_id());

CREATE POLICY "customer_self_update" ON "Customer"
  FOR UPDATE TO authenticated
  USING ("email" = auth.email() AND "tenantId" = current_tenant_id())
  WITH CHECK ("email" = auth.email() AND "tenantId" = current_tenant_id());

-- Staff full access
CREATE POLICY "customer_staff_all" ON "Customer"
  FOR ALL TO authenticated
  USING ("tenantId" = current_tenant_id() AND is_staff())
  WITH CHECK ("tenantId" = current_tenant_id() AND is_staff());

-- ============================================================================
-- PAYMENT POLICIES
-- ============================================================================

ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- Customer: read own payments
CREATE POLICY "payment_customer_select" ON "Payment"
  FOR SELECT TO authenticated
  USING (
    "bookingId" IN (
      SELECT "id" FROM "Booking" 
      WHERE "customerId" IN (
        SELECT "id" FROM "Customer" WHERE "email" = auth.email()
      )
      AND "tenantId" = current_tenant_id()
    )
  );

-- Staff full access
CREATE POLICY "payment_staff_all" ON "Payment"
  FOR ALL TO authenticated
  USING ("tenantId" = current_tenant_id() AND is_staff())
  WITH CHECK ("tenantId" = current_tenant_id() AND is_staff());

-- ============================================================================
-- VOUCHER POLICIES
-- ============================================================================

ALTER TABLE "Voucher" ENABLE ROW LEVEL SECURITY;

-- Customer: read own vouchers
CREATE POLICY "voucher_customer_select" ON "Voucher"
  FOR SELECT TO authenticated
  USING (
    "bookingId" IN (
      SELECT "id" FROM "Booking" 
      WHERE "customerId" IN (
        SELECT "id" FROM "Customer" WHERE "email" = auth.email()
      )
      AND "tenantId" = current_tenant_id()
    )
  );

-- Public: verify voucher (no auth, by bookingCode via join)
CREATE POLICY "voucher_public_verify" ON "Voucher"
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM "Booking" b
      WHERE b."id" = "Voucher"."bookingId"
      AND b."tenantId" = current_tenant_id()
    )
  );

-- Staff full access
CREATE POLICY "voucher_staff_all" ON "Voucher"
  FOR ALL TO authenticated
  USING ("tenantId" = current_tenant_id() AND is_staff())
  WITH CHECK ("tenantId" = current_tenant_id() AND is_staff());

-- ============================================================================
-- REVIEW POLICIES
-- ============================================================================

ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

-- Public: read approved reviews
CREATE POLICY "review_public_select" ON "Review"
  FOR SELECT TO anon, authenticated
  USING ("isApproved" = true AND "tenantId" = current_tenant_id());

-- Customer: read own reviews (including pending)
CREATE POLICY "review_customer_select" ON "Review"
  FOR SELECT TO authenticated
  USING (
    "customerId" IN (
      SELECT "id" FROM "Customer" WHERE "email" = auth.email()
    )
    AND "tenantId" = current_tenant_id()
  );

-- Customer: create review (via invite or verified booking)
CREATE POLICY "review_customer_insert" ON "Review"
  FOR INSERT TO authenticated
  WITH CHECK (
    "tenantId" = current_tenant_id()
    AND "customerId" IN (
      SELECT "id" FROM "Customer" WHERE "email" = auth.email()
    )
  );

-- Staff: moderate (update isApproved)
CREATE POLICY "review_staff_moderate" ON "Review"
  FOR UPDATE TO authenticated
  USING ("tenantId" = current_tenant_id() AND is_staff())
  WITH CHECK ("tenantId" = current_tenant_id() AND is_staff());

-- ============================================================================
-- REVIEW INVITE POLICIES
-- ============================================================================

ALTER TABLE "ReviewInvite" ENABLE ROW LEVEL SECURITY;

-- Public: submit via invite token (no auth)
CREATE POLICY "review_invite_public_submit" ON "ReviewInvite"
  FOR SELECT TO anon, authenticated
  USING ("status" = 'UNUSED' AND "expiresAt" > NOW());

-- Staff: manage invites
CREATE POLICY "review_invite_staff_all" ON "ReviewInvite"
  FOR ALL TO authenticated
  USING ("ventureId" IN (
    SELECT "id" FROM "Venture" WHERE "tenantId" = current_tenant_id()
  ) AND is_staff())
  WITH CHECK ("ventureId" IN (
    SELECT "id" FROM "Venture" WHERE "tenantId" = current_tenant_id()
  ) AND is_staff());

-- ============================================================================
-- ARTICLE (SEO CONTENT) POLICIES
-- ============================================================================

ALTER TABLE "Article" ENABLE ROW LEVEL SECURITY;

-- Public: read published articles
CREATE POLICY "article_public_select" ON "Article"
  FOR SELECT TO anon, authenticated
  USING ("publishedAt" IS NOT NULL AND "publishedAt" <= NOW() AND "tenantId" = current_tenant_id());

-- Staff: full access
CREATE POLICY "article_staff_all" ON "Article"
  FOR ALL TO authenticated
  USING ("tenantId" = current_tenant_id() AND is_staff())
  WITH CHECK ("tenantId" = current_tenant_id() AND is_staff());

-- ============================================================================
-- VENDOR POLICIES (Internal Operations)
-- ============================================================================

ALTER TABLE "Vendor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VendorContract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VendorPayout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VendorIncident" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VendorPerformanceLog" ENABLE ROW LEVEL SECURITY;

-- Staff only (vendors don't have direct DB access in Phase 1)
CREATE POLICY "vendor_staff_all" ON "Vendor"
  FOR ALL TO authenticated
  USING (current_tenant_id() IS NOT NULL AND is_staff())
  WITH CHECK (current_tenant_id() IS NOT NULL AND is_staff());

CREATE POLICY "vendor_contract_staff_all" ON "VendorContract"
  FOR ALL TO authenticated
  USING (current_tenant_id() IS NOT NULL AND is_staff())
  WITH CHECK (current_tenant_id() IS NOT NULL AND is_staff());

CREATE POLICY "vendor_payout_staff_all" ON "VendorPayout"
  FOR ALL TO authenticated
  USING (current_tenant_id() IS NOT NULL AND is_staff())
  WITH CHECK (current_tenant_id() IS NOT NULL AND is_staff());

CREATE POLICY "vendor_incident_staff_all" ON "VendorIncident"
  FOR ALL TO authenticated
  USING (current_tenant_id() IS NOT NULL AND is_staff())
  WITH CHECK (current_tenant_id() IS NOT NULL AND is_staff());

CREATE POLICY "vendor_perf_staff_all" ON "VendorPerformanceLog"
  FOR ALL TO authenticated
  USING (current_tenant_id() IS NOT NULL AND is_staff())
  WITH CHECK (current_tenant_id() IS NOT NULL AND is_staff());

-- ============================================================================
-- AGENT SESSION POLICIES (AI Customer Service)
-- ============================================================================

ALTER TABLE "AgentSession" ENABLE ROW LEVEL SECURITY;

-- Service role (AI Agent backend) full access
CREATE POLICY "agent_session_service_all" ON "AgentSession"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Staff: read for analytics
CREATE POLICY "agent_session_staff_select" ON "AgentSession"
  FOR SELECT TO authenticated
  USING (is_staff());

-- ============================================================================
-- NOTIFICATION LOG POLICIES
-- ============================================================================

ALTER TABLE "NotificationLog" ENABLE ROW LEVEL SECURITY;

-- Staff only
CREATE POLICY "notification_staff_all" ON "NotificationLog"
  FOR ALL TO authenticated
  USING (current_tenant_id() IS NOT NULL AND is_staff())
  WITH CHECK (current_tenant_id() IS NOT NULL AND is_staff());

-- ============================================================================
-- MEDIA ASSET POLICIES
-- ============================================================================

ALTER TABLE "MediaAsset" ENABLE ROW LEVEL SECURITY;

-- Public: read venture assets
CREATE POLICY "media_asset_public_select" ON "MediaAsset"
  FOR SELECT TO anon, authenticated
  USING (
    "ventureId" IS NULL 
    OR EXISTS (
      SELECT 1 FROM "Venture" v 
      WHERE v."id" = "MediaAsset"."ventureId" 
      AND v."tenantId" = current_tenant_id()
    )
  );

-- Staff: full access
CREATE POLICY "media_asset_staff_all" ON "MediaAsset"
  FOR ALL TO authenticated
  USING (
    "ventureId" IS NULL 
    OR EXISTS (
      SELECT 1 FROM "Venture" v 
      WHERE v."id" = "MediaAsset"."ventureId" 
      AND v."tenantId" = current_tenant_id()
      AND is_staff()
    )
  )
  WITH CHECK (
    "ventureId" IS NULL 
    OR EXISTS (
      SELECT 1 FROM "Venture" v 
      WHERE v."id" = "MediaAsset"."ventureId" 
      AND v."tenantId" = current_tenant_id()
      AND is_staff()
    )
  );

-- ============================================================================
-- LOCATION POLICIES
-- ============================================================================

ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;

-- Public read (for address dropdowns)
CREATE POLICY "location_public_select" ON "Location"
  FOR SELECT TO anon, authenticated
  USING (true);

-- Staff write
CREATE POLICY "location_staff_all" ON "Location"
  FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- ============================================================================
-- REFUND & BOOKING CHANGE POLICIES
-- ============================================================================

ALTER TABLE "Refund" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingChange" ENABLE ROW LEVEL SECURITY;

-- Customer: read own
CREATE POLICY "refund_customer_select" ON "Refund"
  FOR SELECT TO authenticated
  USING (
    "bookingId" IN (
      SELECT "id" FROM "Booking" 
      WHERE "customerId" IN (
        SELECT "id" FROM "Customer" WHERE "email" = auth.email()
      )
      AND "tenantId" = current_tenant_id()
    )
  );

CREATE POLICY "booking_change_customer_select" ON "BookingChange"
  FOR SELECT TO authenticated
  USING (
    "bookingId" IN (
      SELECT "id" FROM "Booking" 
      WHERE "customerId" IN (
        SELECT "id" FROM "Customer" WHERE "email" = auth.email()
      )
      AND "tenantId" = current_tenant_id()
    )
  );

-- Staff full
CREATE POLICY "refund_staff_all" ON "Refund"
  FOR ALL TO authenticated
  USING ("tenantId" = current_tenant_id() AND is_staff())
  WITH CHECK ("tenantId" = current_tenant_id() AND is_staff());

CREATE POLICY "booking_change_staff_all" ON "BookingChange"
  FOR ALL TO authenticated
  USING ("tenantId" = current_tenant_id() AND is_staff())
  WITH CHECK ("tenantId" = current_tenant_id() AND is_staff());

-- ============================================================================
-- COUPON POLICIES
-- ============================================================================

ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;

-- Public: validate coupon (by code)
CREATE POLICY "coupon_public_validate" ON "Coupon"
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true AND ("validFrom" IS NULL OR "validFrom" <= NOW()) AND ("validUntil" IS NULL OR "validUntil" >= NOW()));

-- Staff full
CREATE POLICY "coupon_staff_all" ON "Coupon"
  FOR ALL TO authenticated
  USING (current_tenant_id() IS NOT NULL AND is_staff())
  WITH CHECK (current_tenant_id() IS NOT NULL AND is_staff());

-- ============================================================================
-- MIDDLEWARE INTEGRATION (Next.js)
-- ============================================================================
/*
Add to src/middleware.ts:

import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll, setAll } }
  );
  
  // Get tenant from subdomain or header
  const tenantId = request.headers.get('x-tenant-id') 
    || request.nextUrl.hostname.split('.')[0] 
    || 'baliwild'; // default
  
  // Set RLS context
  await supabase.rpc('set_config', { 
    setting_name: 'app.current_tenant_id', 
    setting_value: tenantId, 
    is_local: true 
  });
  
  return NextResponse.next();
}
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
/*
-- Check RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- List policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test as anon
SET ROLE anon;
SET LOCAL app.current_tenant_id = 'baliwild-tenant-id';
SELECT * FROM "Venture" LIMIT 1; -- Should work
SELECT * FROM "Booking" LIMIT 1; -- Should return 0 rows

-- Test as authenticated user
SET ROLE authenticated;
SET LOCAL app.current_tenant_id = 'baliwild-tenant-id';
-- Requires auth.uid() set
*/