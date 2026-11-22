-- Growth Content Architecture Phase 3: Add GrowthTopic / ContentAsset / ContentVersion /
-- FactSource / PlatformPublish / ApprovalRequest / MetricSnapshot / AuditEvent tables.
-- These tables power the multi-format content producer (Phase 2 assets persist here).
-- Owner approval required before deploying (docs/CONTENT_GROWTH_ARCHITECT.md ┬º13.2).

-- GrowthTopic: the unit of work from research to publication.
CREATE TABLE IF NOT EXISTS "GrowthTopic" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clusterId" TEXT,
    "canonicalTitle" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GrowthTopic_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GrowthTopic_tenantId_idx" ON "GrowthTopic"("tenantId");
CREATE INDEX IF NOT EXISTS "GrowthTopic_status_idx" ON "GrowthTopic"("status");
CREATE INDEX IF NOT EXISTS "GrowthTopic_intent_idx" ON "GrowthTopic"("intent");
CREATE INDEX IF NOT EXISTS "GrowthTopic_priority_idx" ON "GrowthTopic"("priority");

-- FactSource: a verified fact a claim may cite.
CREATE TABLE IF NOT EXISTS "FactSource" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    CONSTRAINT "FactSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FactSource_topicId_idx" ON "FactSource"("topicId");
CREATE INDEX IF NOT EXISTS "FactSource_sourceType_idx" ON "FactSource"("sourceType");

-- ContentVersion: immutable version of an asset body; contentHash detects duplication.
CREATE TABLE IF NOT EXISTS "ContentVersion" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "contentHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ContentVersion_contentHash_key" ON "ContentVersion"("contentHash");
CREATE INDEX IF NOT EXISTS "ContentVersion_assetId_idx" ON "ContentVersion"("assetId");

-- ContentAsset: one format-specific artefact derived from a topic brief.
-- CONTENT_FORMATS = ARTICLE | VIDEO_SCRIPT | SHORT_HOOK | SOCIAL_POST | FAQ_BLOCK
-- PLATFORMS = WEB | YOUTUBE | TIKTOK | FACEBOOK | AI_ANSWER
CREATE TABLE IF NOT EXISTS "ContentAsset" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentAsset_topicId_idx" ON "ContentAsset"("topicId");
CREATE INDEX IF NOT EXISTS "ContentAsset_tenantId_idx" ON "ContentAsset"("tenantId");
CREATE INDEX IF NOT EXISTS "ContentAsset_format_idx" ON "ContentAsset"("format");
CREATE INDEX IF NOT EXISTS "ContentAsset_platform_idx" ON "ContentAsset"("platform");
CREATE INDEX IF NOT EXISTS "ContentAsset_status_idx" ON "ContentAsset"("status");
CREATE INDEX IF NOT EXISTS "ContentAsset_lang_idx" ON "ContentAsset"("lang");

-- PlatformPublish: publication state per asset per platform.
CREATE TABLE IF NOT EXISTS "PlatformPublish" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "externalId" TEXT,
    "publicUrl" TEXT,
    "approvalId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformPublish_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PlatformPublish_assetId_idx" ON "PlatformPublish"("assetId");
CREATE INDEX IF NOT EXISTS "PlatformPublish_platform_idx" ON "PlatformPublish"("platform");
CREATE INDEX IF NOT EXISTS "PlatformPublish_status_idx" ON "PlatformPublish"("status");
CREATE INDEX IF NOT EXISTS "PlatformPublish_approvalId_idx" ON "PlatformPublish"("approvalId");

-- ApprovalRequest: human gate for risky publication.
CREATE TABLE IF NOT EXISTS "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewer" TEXT,
    "reason" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ApprovalRequest_assetId_idx" ON "ApprovalRequest"("assetId");
CREATE INDEX IF NOT EXISTS "ApprovalRequest_tenantId_idx" ON "ApprovalRequest"("tenantId");
CREATE INDEX IF NOT EXISTS "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- MetricSnapshot: daily metric reading for one asset on one platform.
CREATE TABLE IF NOT EXISTS "MetricSnapshot" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "ctr" DOUBLE PRECISION,
    "avgPosition" DOUBLE PRECISION,
    "retention" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetricSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MetricSnapshot_assetId_idx" ON "MetricSnapshot"("assetId");
CREATE INDEX IF NOT EXISTS "MetricSnapshot_platform_idx" ON "MetricSnapshot"("platform");
CREATE INDEX IF NOT EXISTS "MetricSnapshot_date_idx" ON "MetricSnapshot"("date");
CREATE INDEX IF NOT EXISTS "MetricSnapshot_source_idx" ON "MetricSnapshot"("source");

-- AuditEvent: immutable audit trail for every state change and decision.
CREATE TABLE IF NOT EXISTS "AuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditEvent_tenantId_idx" ON "AuditEvent"("tenantId");
CREATE INDEX IF NOT EXISTS "AuditEvent_entity_idx" ON "AuditEvent"("entity");
CREATE INDEX IF NOT EXISTS "AuditEvent_entityId_idx" ON "AuditEvent"("entityId");
CREATE INDEX IF NOT EXISTS "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- Foreign keys
ALTER TABLE "FactSource" ADD CONSTRAINT "FactSource_topicId_fkey"
    FOREIGN KEY ("topicId") REFERENCES "GrowthTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_topicId_fkey"
    FOREIGN KEY ("topicId") REFERENCES "GrowthTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_currentVersionId_fkey"
    FOREIGN KEY ("currentVersionId") REFERENCES "ContentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlatformPublish" ADD CONSTRAINT "PlatformPublish_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MetricSnapshot" ADD CONSTRAINT "MetricSnapshot_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;