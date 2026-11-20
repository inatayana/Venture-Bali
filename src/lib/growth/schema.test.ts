import { buildTransitionAuditEvent } from './schema';

describe('buildTransitionAuditEvent', () => {
  it('builds an audit payload for a topic transition', () => {
    const event = buildTransitionAuditEvent({
      entity: 'GROWTH_TOPIC',
      entityId: 'topic-1',
      tenantId: 'tenant-1',
      fromStatus: 'BRIEFED',
      toStatus: 'IN_PRODUCTION',
      actor: 'system',
      action: 'TRANSITION',
      metadata: { reason: 'cron' },
    });

    expect(event).toEqual({
      tenantId: 'tenant-1',
      entity: 'GROWTH_TOPIC',
      entityId: 'topic-1',
      action: 'TRANSITION',
      actor: 'system',
      fromStatus: 'BRIEFED',
      toStatus: 'IN_PRODUCTION',
      metadata: { reason: 'cron' },
    });
  });

  it('builds an audit payload for an approval decision', () => {
    const event = buildTransitionAuditEvent({
      entity: 'APPROVAL_REQUEST',
      entityId: 'approval-1',
      tenantId: 'tenant-1',
      fromStatus: null,
      toStatus: 'APPROVED',
      actor: 'admin-1',
      action: 'APPROVE',
      metadata: { assetId: 'asset-1' },
    });

    expect(event).toEqual({
      tenantId: 'tenant-1',
      entity: 'APPROVAL_REQUEST',
      entityId: 'approval-1',
      action: 'APPROVE',
      actor: 'admin-1',
      fromStatus: null,
      toStatus: 'APPROVED',
      metadata: { assetId: 'asset-1' },
    });
  });
});