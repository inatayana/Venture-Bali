-- =============================================================================
-- BaliWild — Growth Content Schema (Supabase / PostgreSQL)
-- =============================================================================
-- Reference DDL for the autonomous growth system.
--
-- Status: PROPOSAL — not applied yet.
-- The canonical contract lives in src/lib/growth/schema.ts and the state
-- machine in src/lib/growth/state.ts. This file mirrors them so the tables can
-- be created on Supabase before (or instead of) adding Prisma models.
--
-- Before using in production:
--   1. Owner approves the schema (AGENTS.md §4).
--   2. Add matching models/enums to prisma/schema.prisma.
--   3. Create a real Prisma migration and verify on an empty database:
--        npm run db:seed
--        npm run smoke
--
-- Enum values are stored as TEXT + CHECK (not Postgres ENUM) so a value can be
-- added without ALTER TYPE. Keep these lists in sync with schema.ts.
-- =============================================================================

CREATE TABLE IF NOT EXISTS growth_topic (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  cluster_id      TEXT,
  canonical_title TEXT NOT NULL,
  intent          TEXT NOT NULL
                  CHECK (intent IN ('INFORMATIONAL', 'COMMERCIAL', 'TRANSACTIONAL', 'NAVIGATIONAL')),
  status          TEXT NOT NULL
                  CHECK (status IN (
                    'DISCOVERED', 'TRIAGED', 'BRIEFED', 'IN_PRODUCTION',
                    'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED',
                    'MONITORED', 'NEEDS_REFRESH', 'ARCHIVED'
                  )),
  priority        INTEGER NOT NULL DEFAULT 0,
  source          TEXT NOT NULL,
  owner           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS growth_topic_tenant_status_idx
  ON growth_topic (tenant_id, status);
CREATE INDEX IF NOT EXISTS growth_topic_cluster_idx
  ON growth_topic (cluster_id);
CREATE INDEX IF NOT EXISTS growth_topic_priority_idx
  ON growth_topic (tenant_id, priority DESC);

CREATE TABLE IF NOT EXISTS keyword_signal (
  id            TEXT PRIMARY KEY,
  topic_id      TEXT NOT NULL REFERENCES growth_topic (id) ON DELETE CASCADE,
  query         TEXT NOT NULL,
  platform      TEXT NOT NULL
                CHECK (platform IN ('WEB', 'YOUTUBE', 'TIKTOK', 'FACEBOOK', 'AI_ANSWER')),
  volume        INTEGER,
  difficulty    INTEGER,
  ctr           NUMERIC,
  avg_position  NUMERIC,
  trend         TEXT NOT NULL DEFAULT 'UNKNOWN'
                CHECK (trend IN ('RISING', 'STABLE', 'FALLING', 'UNKNOWN')),
  serp_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS keyword_signal_topic_idx
  ON keyword_signal (topic_id);
CREATE INDEX IF NOT EXISTS keyword_signal_query_idx
  ON keyword_signal (query);

CREATE TABLE IF NOT EXISTS content_asset (
  id                TEXT PRIMARY KEY,
  topic_id          TEXT NOT NULL REFERENCES growth_topic (id) ON DELETE CASCADE,
  tenant_id         TEXT NOT NULL,
  format            TEXT NOT NULL
                    CHECK (format IN ('ARTICLE', 'VIDEO_SCRIPT', 'SHORT_HOOK', 'SOCIAL_POST', 'FAQ_BLOCK')),
  platform          TEXT NOT NULL
                    CHECK (platform IN ('WEB', 'YOUTUBE', 'TIKTOK', 'FACEBOOK', 'AI_ANSWER')),
  status            TEXT NOT NULL
                    CHECK (status IN (
                      'DRAFT', 'FACT_CHECK', 'STYLE_CHECK', 'BRAND_LEGAL_CHECK',
                      'READY', 'APPROVED', 'SCHEDULED', 'PUBLISHED',
                      'MEASURED', 'REFRESH', 'ARCHIVED'
                    )),
  lang              TEXT NOT NULL DEFAULT 'en'
                    CHECK (lang IN ('en', 'id')),
  title             TEXT NOT NULL,
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_version_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_asset_topic_idx
  ON content_asset (topic_id);
CREATE INDEX IF NOT EXISTS content_asset_tenant_status_idx
  ON content_asset (tenant_id, status);
CREATE INDEX IF NOT EXISTS content_asset_platform_idx
  ON content_asset (platform);

CREATE TABLE IF NOT EXISTS content_version (
  id             TEXT PRIMARY KEY,
  asset_id       TEXT NOT NULL REFERENCES content_asset (id) ON DELETE CASCADE,
  version        INTEGER NOT NULL,
  content_hash   TEXT NOT NULL,
  model          TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  body           JSONB NOT NULL,
  change_note    TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (asset_id, version)
);

CREATE INDEX IF NOT EXISTS content_version_hash_idx
  ON content_version (content_hash);

CREATE TABLE IF NOT EXISTS fact_source (
  id           TEXT PRIMARY KEY,
  topic_id     TEXT NOT NULL REFERENCES growth_topic (id) ON DELETE CASCADE,
  claim        TEXT NOT NULL,
  source_url   TEXT NOT NULL,
  source_type  TEXT NOT NULL
               CHECK (source_type IN ('DB', 'POLICY', 'OPERATOR', 'OFFICIAL', 'OTHER')),
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS fact_source_topic_idx
  ON fact_source (topic_id);
CREATE INDEX IF NOT EXISTS fact_source_expiry_idx
  ON fact_source (expires_at);

CREATE TABLE IF NOT EXISTS platform_publish (
  id          TEXT PRIMARY KEY,
  asset_id    TEXT NOT NULL REFERENCES content_asset (id) ON DELETE CASCADE,
  platform    TEXT NOT NULL
              CHECK (platform IN ('WEB', 'YOUTUBE', 'TIKTOK', 'FACEBOOK', 'AI_ANSWER')),
  status      TEXT NOT NULL
              CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELLED')),
  external_id TEXT,
  public_url  TEXT,
  approval_id TEXT,
  published_at TIMESTAMPTZ,
  error_code  TEXT
);

CREATE INDEX IF NOT EXISTS platform_publish_asset_idx
  ON platform_publish (asset_id);
CREATE INDEX IF NOT EXISTS platform_publish_status_idx
  ON platform_publish (status);

CREATE TABLE IF NOT EXISTS approval_request (
  id           TEXT PRIMARY KEY,
  asset_id     TEXT NOT NULL REFERENCES content_asset (id) ON DELETE CASCADE,
  tenant_id    TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  status       TEXT NOT NULL
               CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  reviewer     TEXT,
  reason       TEXT NOT NULL,
  decided_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS approval_request_tenant_status_idx
  ON approval_request (tenant_id, status);
CREATE INDEX IF NOT EXISTS approval_request_asset_idx
  ON approval_request (asset_id);

CREATE TABLE IF NOT EXISTS metric_snapshot (
  id          TEXT PRIMARY KEY,
  asset_id    TEXT NOT NULL REFERENCES content_asset (id) ON DELETE CASCADE,
  platform    TEXT NOT NULL
              CHECK (platform IN ('WEB', 'YOUTUBE', 'TIKTOK', 'FACEBOOK', 'AI_ANSWER')),
  date        TEXT NOT NULL,
  impressions INTEGER,
  clicks      INTEGER,
  ctr         NUMERIC,
  avg_position NUMERIC,
  retention   NUMERIC,
  source      TEXT NOT NULL
              CHECK (source IN ('GSC', 'GA4', 'YOUTUBE', 'TIKTOK', 'FACEBOOK', 'ADSENSE', 'MANUAL')),
  UNIQUE (asset_id, platform, date, source)
);

CREATE INDEX IF NOT EXISTS metric_snapshot_asset_date_idx
  ON metric_snapshot (asset_id, date DESC);

CREATE TABLE IF NOT EXISTS audit_event (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  entity      TEXT NOT NULL
              CHECK (entity IN ('GROWTH_TOPIC', 'CONTENT_ASSET', 'APPROVAL_REQUEST', 'PLATFORM_PUBLISH')),
  entity_id   TEXT NOT NULL,
  action      TEXT NOT NULL,
  actor       TEXT NOT NULL,
  from_status TEXT,
  to_status   TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_event_tenant_entity_idx
  ON audit_event (tenant_id, entity, entity_id);
CREATE INDEX IF NOT EXISTS audit_event_created_idx
  ON audit_event (created_at DESC);
