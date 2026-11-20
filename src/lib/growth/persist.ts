/**
 * BaliWild — Growth Phase 3b: Persist generated assets to the Growth tables.
 *
 * Once the owner-approved migration (Phase 3, prisma migration
 * 20261120210000_add_growth_tables) is deployed, `produceAsset` can persist
 * generated multi-format payloads to the `ContentAsset` / `ContentVersion` /
 * `GrowthTopic` / `AuditEvent` tables. Until then this module is not wired
 * into the runtime.
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §9, §13.2
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { computeContentHash } from './state';

export interface PersistAssetInput {
  /** The brief that produced the asset. */
  readonly brief: {
    readonly title: string;
    readonly primaryKeyword: string;
    readonly category: string;
    readonly destination?: string;
    readonly language?: 'en' | 'id';
  };
  /** Format-specific payload to persist. */
  readonly payload: Prisma.InputJsonValue;
  /** Content format, e.g. ARTICLE | VIDEO_SCRIPT | SHORT_HOOK | SOCIAL_POST | FAQ_BLOCK. */
  readonly format: string;
  readonly platform: 'WEB' | 'YOUTUBE' | 'TIKTOK' | 'FACEBOOK' | 'AI_ANSWER';
  /** Asset status after generation. Default: READY (gate passed). */
  readonly status?: string;
  /** Human-actor for the audit event. Default: 'growth-producer'. */
  readonly actor?: string;
  /** Tenant id (single-tenant now; future multi-tenant). Default 'default'. */
  readonly tenantId?: string;
}

export interface PersistAssetResult {
  readonly topicId: string;
  readonly assetId: string;
  readonly versionId: string;
  readonly auditEventId: string;
  readonly platformPublishId: string | null;
  readonly approvalRequestId: string | null;
}

export async function persistGrowthAsset(
  input: PersistAssetInput
): Promise<PersistAssetResult> {
  const { brief, payload, format, platform } = input;
  const status = input.status ?? 'READY';
  const actor = input.actor ?? 'growth-producer';
  const tenantId = input.tenantId ?? 'default';

  // 1. Create / find GrowthTopic (clustered by canonical title).
  const topic = await prisma.growthTopic.create({
    data: {
      tenantId,
      clusterId: null,
      canonicalTitle: brief.title,
      intent: 'INFORMATIONAL',
      status: 'IN_PRODUCTION',
      priority: 0,
      source: 'GSC',
      owner: null,
      updatedAt: new Date(),
    },
  });

  // 2. Create ContentAsset.
  const asset = await prisma.contentAsset.create({
    data: {
      topicId: topic.id,
      tenantId,
      format,
      platform,
      status,
      lang: brief.language ?? 'id',
      title: brief.title,
      payload,
      currentVersionId: null,
    },
  });

  // 3. Create ContentVersion (immutable, content hash detects dupes).
  const contentHash = await computeContentHash({
    title: brief.title,
    slug: brief.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    content: JSON.stringify(payload),
    metaDesc: '',
    keywords: [brief.primaryKeyword],
    tags: [],
    ventureId: null,
  });

  const version = await prisma.contentVersion.create({
    data: {
      assetId: asset.id,
      version: 1,
      contentHash,
      model: 'gemini-2.0-flash',
      promptVersion: 'phase2-v1',
      body: payload,
      changeNote: 'phase3b growth asset',
    },
  });

  // 4. Point asset at current version.
  await prisma.contentAsset.update({
    where: { id: asset.id },
    data: { currentVersionId: version.id, updatedAt: new Date() },
  });

  // 5. Audit event (GENERATE transition).
  const auditFrom = null;
  const auditTo = status;
  const auditEntity = 'CONTENT_ASSET';
  const auditId = await prisma.auditEvent.create({
    data: {
      tenantId,
      entity: auditEntity,
      entityId: asset.id,
      action: 'GENERATE',
      actor,
      fromStatus: auditFrom,
      toStatus: auditTo,
      metadata: {
        format,
        platform,
        contentHash,
      },
      topicId: topic.id,
      createdAt: new Date(),
    },
  });

  // 6. Human approval + platform publish (publication remains human-gated by default).
  const approval = await prisma.approvalRequest.create({
    data: {
      assetId: asset.id,
      tenantId,
      requestedBy: actor,
      status: 'PENDING',
      reason: 'growth-producer human gate',
      createdAt: new Date(),
    },
  });

  const publish = await prisma.platformPublish.create({
    data: {
      assetId: asset.id,
      platform,
      status: 'DRAFT',
      approvalId: approval.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return {
    topicId: topic.id,
    assetId: asset.id,
    versionId: version.id,
    auditEventId: auditId.id,
    platformPublishId: publish.id,
    approvalRequestId: approval.id,
  };
}
