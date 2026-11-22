import {
  AUDIT_ENTITIES,
  CONTENT_FORMATS,
  GROWTH_TABLES,
  METRIC_SOURCES,
  PLATFORMS,
  SEARCH_INTENTS,
  buildTransitionAuditEvent,
} from './schema';
import { CONTENT_ASSET_STATUSES } from './state';

describe('Growth schema metadata', () => {
  it('describes the nine growth tables', () => {
    expect(GROWTH_TABLES.map((table) => table.name)).toEqual([
      'growth_topic',
      'keyword_signal',
      'content_asset',
      'content_version',
      'fact_source',
      'platform_publish',
      'approval_request',
      'metric_snapshot',
      'audit_event',
    ]);
  });

  it('gives every table an id and tenant scoping where customer-facing', () => {
    for (const table of GROWTH_TABLES) {
      expect(table.columns.map((column) => column.name)).toContain('id');
    }

    const tenantScoped = GROWTH_TABLES.filter((table) =>
      table.columns.some((column) => column.name === 'tenant_id'),
    ).map((table) => table.name);

    expect(tenantScoped).toEqual([
      'growth_topic',
      'content_asset',
      'approval_request',
      'audit_event',
    ]);
  });

  it('marks the columns a caller cannot omit', () => {
    const topic = GROWTH_TABLES.find((table) => table.name === 'growth_topic');
    expect(topic?.columns.find((column) => column.name === 'canonical_title')?.required).toBe(
      true,
    );
    expect(topic?.columns.find((column) => column.name === 'cluster_id')?.required).toBe(
      false,
    );
  });

  it('points status columns at the state machine contract', () => {
    const asset = GROWTH_TABLES.find((table) => table.name === 'content_asset');
    const status = asset?.columns.find((column) => column.name === 'status');
    expect(status?.note).toBe('CONTENT_ASSET_STATUSES');
  });
});

describe('Growth enumerations', () => {
  it('keeps the documented platform and format sets', () => {
    expect(PLATFORMS).toEqual(['WEB', 'YOUTUBE', 'TIKTOK', 'FACEBOOK', 'AI_ANSWER']);
    expect(CONTENT_FORMATS).toEqual([
      'ARTICLE',
      'VIDEO_SCRIPT',
      'SHORT_HOOK',
      'SOCIAL_POST',
      'FAQ_BLOCK',
    ]);
  });

  it('keeps intent and metric source sets stable', () => {
    expect(SEARCH_INTENTS).toEqual([
      'INFORMATIONAL',
      'COMMERCIAL',
      'TRANSACTIONAL',
      'NAVIGATIONAL',
    ]);
    expect(METRIC_SOURCES).toContain('GSC');
    expect(METRIC_SOURCES).toContain('ADSENSE');
  });

  it('aligns the asset status note with the state machine', () => {
    expect(CONTENT_ASSET_STATUSES).toContain('BRAND_LEGAL_CHECK');
  });

  it('limits audit entities to the growth domain', () => {
    expect(AUDIT_ENTITIES).toEqual([
      'GROWTH_TOPIC',
      'CONTENT_ASSET',
      'APPROVAL_REQUEST',
      'PLATFORM_PUBLISH',
    ]);
  });
});

describe('buildTransitionAuditEvent', () => {
  it('maps a transition into an auditable payload', () => {
    const event = buildTransitionAuditEvent({
      entity: 'GROWTH_TOPIC',
      entityId: 'top_123',
      tenantId: 'tn_1',
      fromStatus: 'DISCOVERED',
      toStatus: 'TRIAGED',
      actor: 'agent:research',
      metadata: { reason: 'impression gap' },
    });

    expect(event).toEqual({
      tenantId: 'tn_1',
      entity: 'GROWTH_TOPIC',
      entityId: 'top_123',
      action: 'TRANSITION',
      actor: 'agent:research',
      fromStatus: 'DISCOVERED',
      toStatus: 'TRIAGED',
      metadata: { reason: 'impression gap' },
    });
  });

  it('defaults action and metadata', () => {
    const event = buildTransitionAuditEvent({
      entity: 'CONTENT_ASSET',
      entityId: 'ast_1',
      tenantId: 'tn_1',
      fromStatus: null,
      toStatus: 'DRAFT',
      actor: 'agent:editorial',
    });

    expect(event.action).toBe('TRANSITION');
    expect(event.metadata).toEqual({});
  });
});
