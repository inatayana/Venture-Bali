/**
 * BaliWild — Growth Content Schema
 * --------------------------------
 * Canonical data contract for the autonomous growth system.
 *
 * These interfaces are deliberately database-agnostic so the same shape can
 * back a Supabase table, a Prisma model, or a Google Sheet tab. The
 * `GROWTH_TABLES` metadata is the single source for column lists.
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §4
 */

import type { ContentAssetStatus, GrowthTopicStatus } from './state';

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export const SEARCH_INTENTS = [
  'INFORMATIONAL',
  'COMMERCIAL',
  'TRANSACTIONAL',
  'NAVIGATIONAL',
] as const;

export type SearchIntent = (typeof SEARCH_INTENTS)[number];

export const CONTENT_FORMATS = [
  'ARTICLE',
  'VIDEO_SCRIPT',
  'SHORT_HOOK',
  'SOCIAL_POST',
  'FAQ_BLOCK',
] as const;

export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const PLATFORMS = [
  'WEB',
  'YOUTUBE',
  'TIKTOK',
  'FACEBOOK',
  'AI_ANSWER',
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const APPROVAL_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const PUBLISH_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'FAILED',
  'CANCELLED',
] as const;

export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const METRIC_SOURCES = [
  'GSC',
  'GA4',
  'YOUTUBE',
  'TIKTOK',
  'FACEBOOK',
  'ADSENSE',
  'MANUAL',
] as const;

export type MetricSource = (typeof METRIC_SOURCES)[number];

export const FACT_SOURCE_TYPES = [
  'DB',
  'POLICY',
  'OPERATOR',
  'OFFICIAL',
  'OTHER',
] as const;

export type FactSourceType = (typeof FACT_SOURCE_TYPES)[number];

export const KEYWORD_TRENDS = [
  'RISING',
  'STABLE',
  'FALLING',
  'UNKNOWN',
] as const;

export type KeywordTrend = (typeof KEYWORD_TRENDS)[number];

export const AUDIT_ENTITIES = [
  'GROWTH_TOPIC',
  'CONTENT_ASSET',
  'APPROVAL_REQUEST',
  'PLATFORM_PUBLISH',
] as const;

export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/** One canonical topic. The unit of work from research to publication. */
export interface GrowthTopic {
  readonly id: string;
  readonly tenantId: string;
  readonly clusterId: string | null;
  readonly canonicalTitle: string;
  readonly intent: SearchIntent;
  readonly status: GrowthTopicStatus;
  readonly priority: number;
  readonly source: string;
  readonly owner: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** A keyword/query signal captured from one platform. */
export interface KeywordSignal {
  readonly id: string;
  readonly topicId: string;
  readonly query: string;
  readonly platform: Platform;
  readonly volume: number | null;
  readonly difficulty: number | null;
  readonly ctr: number | null;
  readonly avgPosition: number | null;
  readonly trend: KeywordTrend;
  readonly serpFeatures: readonly string[];
  readonly capturedAt: string;
}

/** One format-specific artefact derived from a topic brief. */
export interface ContentAsset {
  readonly id: string;
  readonly topicId: string;
  readonly tenantId: string;
  readonly format: ContentFormat;
  readonly platform: Platform;
  readonly status: ContentAssetStatus;
  readonly lang: 'en' | 'id';
  readonly title: string;
  readonly payload: Record<string, unknown>;
  readonly currentVersionId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Immutable version of an asset body. `contentHash` detects duplication. */
export interface ContentVersion {
  readonly id: string;
  readonly assetId: string;
  readonly version: number;
  readonly contentHash: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly body: Record<string, unknown>;
  readonly changeNote: string;
  readonly createdAt: string;
}

/** A verified fact a claim may cite. Counters hallucination. */
export interface FactSource {
  readonly id: string;
  readonly topicId: string;
  readonly claim: string;
  readonly sourceUrl: string;
  readonly sourceType: FactSourceType;
  readonly retrievedAt: string;
  readonly expiresAt: string | null;
}

/** Publication state for one asset on one platform. */
export interface PlatformPublish {
  readonly id: string;
  readonly assetId: string;
  readonly platform: Platform;
  readonly status: PublishStatus;
  readonly externalId: string | null;
  readonly publicUrl: string | null;
  readonly approvalId: string | null;
  readonly publishedAt: string | null;
  readonly errorCode: string | null;
}

/** Human gate for risky publication. */
export interface ApprovalRequest {
  readonly id: string;
  readonly assetId: string;
  readonly tenantId: string;
  readonly requestedBy: string;
  readonly status: ApprovalStatus;
  readonly reviewer: string | null;
  readonly reason: string;
  readonly decidedAt: string | null;
  readonly createdAt: string;
}

/** A metric reading for one asset on one platform on one day. */
export interface MetricSnapshot {
  readonly id: string;
  readonly assetId: string;
  readonly platform: Platform;
  readonly date: string;
  readonly impressions: number | null;
  readonly clicks: number | null;
  readonly ctr: number | null;
  readonly avgPosition: number | null;
  readonly retention: number | null;
  readonly source: MetricSource;
}

/** Immutable audit trail for every state change and decision. */
export interface AuditEvent {
  readonly id: string;
  readonly tenantId: string;
  readonly entity: AuditEntity;
  readonly entityId: string;
  readonly action: string;
  readonly actor: string;
  readonly fromStatus: string | null;
  readonly toStatus: string | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------
// Table metadata (single source for sheet headers + SQL DDL)
// ---------------------------------------------------------------------------

export type GrowthColumnType =
  | 'string'
  | 'string?'
  | 'number'
  | 'number?'
  | 'boolean'
  | 'json'
  | 'timestamp';

export interface GrowthColumn {
  readonly name: string;
  readonly type: GrowthColumnType;
  readonly required: boolean;
  readonly note?: string;
}

export interface GrowthTable {
  readonly name: string;
  readonly description: string;
  readonly columns: readonly GrowthColumn[];
}

export const GROWTH_TABLES: readonly GrowthTable[] = [
  {
    name: 'growth_topic',
    description: 'Canonical topic; the unit of work from research to publish.',
    columns: [
      { name: 'id', type: 'string', required: true, note: 'cuid' },
      { name: 'tenant_id', type: 'string', required: true },
      { name: 'cluster_id', type: 'string?', required: false },
      { name: 'canonical_title', type: 'string', required: true },
      { name: 'intent', type: 'string', required: true, note: 'SEARCH_INTENTS' },
      { name: 'status', type: 'string', required: true, note: 'GROWTH_TOPIC_STATUSES' },
      { name: 'priority', type: 'number', required: true, note: 'default 0; higher = sooner' },
      { name: 'source', type: 'string', required: true, note: 'GSC | YOUTUBE | TIKTOK | FACEBOOK | MANUAL' },
      { name: 'owner', type: 'string?', required: false },
      { name: 'created_at', type: 'timestamp', required: true },
      { name: 'updated_at', type: 'timestamp', required: true },
    ],
  },
  {
    name: 'keyword_signal',
    description: 'Raw keyword/query signal per platform.',
    columns: [
      { name: 'id', type: 'string', required: true },
      { name: 'topic_id', type: 'string', required: true },
      { name: 'query', type: 'string', required: true },
      { name: 'platform', type: 'string', required: true, note: 'PLATFORMS' },
      { name: 'volume', type: 'number?', required: false },
      { name: 'difficulty', type: 'number?', required: false },
      { name: 'ctr', type: 'number?', required: false },
      { name: 'avg_position', type: 'number?', required: false },
      { name: 'trend', type: 'string', required: true, note: 'KEYWORD_TRENDS' },
      { name: 'serp_features', type: 'json', required: true, note: 'string[]' },
      { name: 'captured_at', type: 'timestamp', required: true },
    ],
  },
  {
    name: 'content_asset',
    description: 'Format-specific artefact derived from a topic brief.',
    columns: [
      { name: 'id', type: 'string', required: true },
      { name: 'topic_id', type: 'string', required: true },
      { name: 'tenant_id', type: 'string', required: true },
      { name: 'format', type: 'string', required: true, note: 'CONTENT_FORMATS' },
      { name: 'platform', type: 'string', required: true, note: 'PLATFORMS' },
      { name: 'status', type: 'string', required: true, note: 'CONTENT_ASSET_STATUSES' },
      { name: 'lang', type: 'string', required: true, note: 'en | id' },
      { name: 'title', type: 'string', required: true },
      { name: 'payload', type: 'json', required: true },
      { name: 'current_version_id', type: 'string?', required: false },
      { name: 'created_at', type: 'timestamp', required: true },
      { name: 'updated_at', type: 'timestamp', required: true },
    ],
  },
  {
    name: 'content_version',
    description: 'Immutable asset version; content_hash detects duplication.',
    columns: [
      { name: 'id', type: 'string', required: true },
      { name: 'asset_id', type: 'string', required: true },
      { name: 'version', type: 'number', required: true },
      { name: 'content_hash', type: 'string', required: true },
      { name: 'model', type: 'string', required: true },
      { name: 'prompt_version', type: 'string', required: true },
      { name: 'body', type: 'json', required: true },
      { name: 'change_note', type: 'string', required: true },
      { name: 'created_at', type: 'timestamp', required: true },
    ],
  },
  {
    name: 'fact_source',
    description: 'Verified fact a claim may cite.',
    columns: [
      { name: 'id', type: 'string', required: true },
      { name: 'topic_id', type: 'string', required: true },
      { name: 'claim', type: 'string', required: true },
      { name: 'source_url', type: 'string', required: true },
      { name: 'source_type', type: 'string', required: true, note: 'FACT_SOURCE_TYPES' },
      { name: 'retrieved_at', type: 'timestamp', required: true },
      { name: 'expires_at', type: 'timestamp', required: false },
    ],
  },
  {
    name: 'platform_publish',
    description: 'Publication state per asset per platform.',
    columns: [
      { name: 'id', type: 'string', required: true },
      { name: 'asset_id', type: 'string', required: true },
      { name: 'platform', type: 'string', required: true, note: 'PLATFORMS' },
      { name: 'status', type: 'string', required: true, note: 'PUBLISH_STATUSES' },
      { name: 'external_id', type: 'string?', required: false },
      { name: 'public_url', type: 'string?', required: false },
      { name: 'approval_id', type: 'string?', required: false },
      { name: 'published_at', type: 'timestamp', required: false },
      { name: 'error_code', type: 'string?', required: false },
    ],
  },
  {
    name: 'approval_request',
    description: 'Human gate for risky publication.',
    columns: [
      { name: 'id', type: 'string', required: true },
      { name: 'asset_id', type: 'string', required: true },
      { name: 'tenant_id', type: 'string', required: true },
      { name: 'requested_by', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, note: 'APPROVAL_STATUSES' },
      { name: 'reviewer', type: 'string?', required: false },
      { name: 'reason', type: 'string', required: true },
      { name: 'decided_at', type: 'timestamp', required: false },
      { name: 'created_at', type: 'timestamp', required: true },
    ],
  },
  {
    name: 'metric_snapshot',
    description: 'Daily metric reading per asset per platform.',
    columns: [
      { name: 'id', type: 'string', required: true },
      { name: 'asset_id', type: 'string', required: true },
      { name: 'platform', type: 'string', required: true, note: 'PLATFORMS' },
      { name: 'date', type: 'string', required: true, note: 'YYYY-MM-DD' },
      { name: 'impressions', type: 'number?', required: false },
      { name: 'clicks', type: 'number?', required: false },
      { name: 'ctr', type: 'number?', required: false },
      { name: 'avg_position', type: 'number?', required: false },
      { name: 'retention', type: 'number?', required: false },
      { name: 'source', type: 'string', required: true, note: 'METRIC_SOURCES' },
    ],
  },
  {
    name: 'audit_event',
    description: 'Immutable audit trail for transitions and decisions.',
    columns: [
      { name: 'id', type: 'string', required: true },
      { name: 'tenant_id', type: 'string', required: true },
      { name: 'entity', type: 'string', required: true, note: 'AUDIT_ENTITIES' },
      { name: 'entity_id', type: 'string', required: true },
      { name: 'action', type: 'string', required: true },
      { name: 'actor', type: 'string', required: true },
      { name: 'from_status', type: 'string?', required: false },
      { name: 'to_status', type: 'string?', required: false },
      { name: 'metadata', type: 'json', required: true },
      { name: 'created_at', type: 'timestamp', required: true },
    ],
  },
];

/**
 * Build the audit payload for a validated transition. The caller assigns the
 * id/timestamps and persists it; keeping this pure makes the trail testable.
 */
export function buildTransitionAuditEvent(input: {
  readonly entity: AuditEntity;
  readonly entityId: string;
  readonly tenantId: string;
  readonly fromStatus: string | null;
  readonly toStatus: string;
  readonly actor: string;
  readonly action?: string;
  readonly metadata?: Record<string, unknown>;
}): Omit<AuditEvent, 'id' | 'createdAt'> {
  return {
    tenantId: input.tenantId,
    entity: input.entity,
    entityId: input.entityId,
    action: input.action ?? 'TRANSITION',
    actor: input.actor,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    metadata: input.metadata ?? {},
  };
}
