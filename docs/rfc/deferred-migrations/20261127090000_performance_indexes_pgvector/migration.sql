-- 2026-11-27: Performance Indexes + pgvector for AI Semantic Search
-- Author: Senior Product & Database Architect
-- References: STRATEGY_20YEAR_ROADMAP.md §5.1 Quick Wins #2, #3

-- 1. Enable pgvector extension for semantic search (AI Agent + Article Search)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add search_vector column to Article for full-text search (Indonesian + English)
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('indonesian', coalesce("content", '')) ||
  to_tsvector('indonesian', coalesce("title"->>'en', '')) ||
  to_tsvector('indonesian', coalesce("title"->>'id', '')) ||
  to_tsvector('english', coalesce("content", '')) ||
  to_tsvector('english', coalesce("title"->>'en', '')) ||
  to_tsvector('english', coalesce("title"->>'id', ''))
) STORED;

-- 3. Add embedding column for semantic search (1536 dimensions for text-embedding-3-small / Gemini)
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 4. GIN index for full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_fts ON "Article" USING GIN (search_vector);

-- 5. HNSW index for vector similarity search (pgvector)
-- Note: Requires pgvector 0.5.0+ and PostgreSQL 14+
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_embedding_hnsw ON "Article" USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 6. Booking indexes for analytics and capacity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_tenant_date_status ON "Booking" ("tenantId", "bookingDate", "lifecycleStatus");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_variant_date_status ON "Booking" ("variantId", "bookingDate", "lifecycleStatus");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_customer_date ON "Booking" ("customerId", "bookingDate" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_payment_status_expires ON "Booking" ("paymentStatus", "expiresAt") WHERE "expiresAt" IS NOT NULL;

-- 7. SlotTime indexes for availability queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_slot_time_variant_date_available ON "SlotTime" ("variantId", "isAvailable") WHERE "isAvailable" = true;

-- 8. Vendor Performance Log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_perf_log_vendor_period ON "VendorPerformanceLog" ("vendorId", "periodStart", "periodEnd");

-- 9. Agent Session cleanup index (TTL)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_session_last_active ON "AgentSession" ("lastActiveAt") WHERE "lastActiveAt" < NOW() - INTERVAL '30 days';

-- 10. Review indexes for moderation and display
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_venture_approved_created ON "Review" ("ventureId", "isApproved", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_source_status ON "Review" ("source", "isApproved");

-- 11. Notification Log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_log_booking_type_status ON "NotificationLog" ("bookingId", "type", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_log_customer_type_status ON "NotificationLog" ("customerId", "type", "status");

-- 12. Venture indexes for catalog queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venture_category_active ON "Venture" ("category", "tenantId") WHERE "tenantId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venture_location_category ON "Venture" ("locationId", "category");

-- 13. Variant indexes for pricing and availability
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variant_venture_fulfillment ON "Variant" ("ventureId", "fulfillmentMode");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variant_pickup_zone ON "Variant" ("pickupZoneId") WHERE "pickupZoneId" IS NOT NULL;

-- 14. PriceTier index for pricing queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_price_tier_variant_pax ON "PriceTier" ("variantId", "minPax", "maxPax");

-- 15. Add vector column to Review for semantic search (guest feedback analysis)
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_embedding_hnsw ON "Review" USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 16. Add vector column to Venture for semantic product search
ALTER TABLE "Venture" ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venture_embedding_hnsw ON "Venture" USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 17. Function to update Article search_vector (if not using generated column)
-- Not needed with GENERATED ALWAYS AS STORED, but kept for reference
-- CREATE OR REPLACE FUNCTION update_article_search_vector() RETURNS trigger AS $$
-- BEGIN
--   NEW.search_vector := 
--     to_tsvector('indonesian', coalesce(NEW.content, '')) ||
--     to_tsvector('indonesian', coalesce(NEW.title->>'en', '')) ||
--     to_tsvector('indonesian', coalesce(NEW.title->>'id', '')) ||
--     to_tsvector('english', coalesce(NEW.content, '')) ||
--     to_tsvector('english', coalesce(NEW.title->>'en', '')) ||
--     to_tsvector('english', coalesce(NEW.title->>'id', ''));
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- 18. Comment on indexes for documentation
COMMENT ON INDEX idx_article_fts IS 'Full-text search for articles (Indonesian + English)';
COMMENT ON INDEX idx_article_embedding_hnsw IS 'Vector similarity search for AI Agent article recommendations';
COMMENT ON INDEX idx_booking_tenant_date_status IS 'Tenant-scoped booking analytics by date and lifecycle';
COMMENT ON INDEX idx_slot_time_variant_date_available IS 'Fast availability lookups for booking flow';
COMMENT ON INDEX idx_vendor_perf_log_vendor_period IS 'Vendor performance dashboard queries';
COMMENT ON INDEX idx_agent_session_last_active IS 'TTL cleanup for AI Agent sessions (>30 days idle)';
COMMENT ON INDEX idx_review_embedding_hnsw IS 'Semantic search for guest feedback analysis';
COMMENT ON INDEX idx_venture_embedding_hnsw IS 'Semantic search for AI Agent product recommendations';