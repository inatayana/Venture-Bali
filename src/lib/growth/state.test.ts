import {
  ASSET_TRANSITIONS,
  CONTENT_ASSET_STATUSES,
  GROWTH_TOPIC_STATUSES,
  InvalidTransitionError,
  TOPIC_TRANSITIONS,
  assertAssetTransition,
  assertTopicTransition,
  canTransitionAsset,
  canTransitionTopic,
  isAssetTerminal,
  isTopicTerminal,
  nextAssetStatuses,
  nextTopicStatuses,
  planAssetTransition,
  planTopicTransition,
} from './state';

describe('Growth topic lifecycle', () => {
  it('exposes the documented statuses in order', () => {
    expect(GROWTH_TOPIC_STATUSES).toEqual([
      'DISCOVERED',
      'TRIAGED',
      'BRIEFED',
      'IN_PRODUCTION',
      'IN_REVIEW',
      'APPROVED',
      'SCHEDULED',
      'PUBLISHED',
      'MONITORED',
      'NEEDS_REFRESH',
      'ARCHIVED',
    ]);
  });

  it('walks the happy path from discovery to monitoring', () => {
    const path = [
      'DISCOVERED',
      'TRIAGED',
      'BRIEFED',
      'IN_PRODUCTION',
      'IN_REVIEW',
      'APPROVED',
      'SCHEDULED',
      'PUBLISHED',
      'MONITORED',
    ] as const;

    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransitionTopic(path[i], path[i + 1])).toBe(true);
    }
  });

  it('loops a decaying topic back to the brief stage', () => {
    expect(canTransitionTopic('MONITORED', 'NEEDS_REFRESH')).toBe(true);
    expect(canTransitionTopic('NEEDS_REFRESH', 'BRIEFED')).toBe(true);
  });

  it('rejects skipping straight to published', () => {
    expect(canTransitionTopic('DISCOVERED', 'PUBLISHED')).toBe(false);
    expect(planTopicTransition('DISCOVERED', 'PUBLISHED')).toMatchObject({
      ok: false,
      from: 'DISCOVERED',
      to: 'PUBLISHED',
    });
  });

  it('rejects jumping out of a terminal archive', () => {
    expect(isTopicTerminal('ARCHIVED')).toBe(true);
    expect(nextTopicStatuses('ARCHIVED')).toEqual([]);
    expect(canTransitionTopic('ARCHIVED', 'BRIEFED')).toBe(false);
  });

  it('throws a typed error from the assert helper', () => {
    expect(() => assertTopicTransition('PUBLISHED', 'DISCOVERED')).toThrow(
      InvalidTransitionError,
    );
  });

  it('allows an authorised rollback from scheduled to approved', () => {
    expect(canTransitionTopic('SCHEDULED', 'APPROVED')).toBe(true);
  });
});

describe('Content asset lifecycle', () => {
  it('exposes the documented statuses in order', () => {
    expect(CONTENT_ASSET_STATUSES).toEqual([
      'DRAFT',
      'FACT_CHECK',
      'STYLE_CHECK',
      'BRAND_LEGAL_CHECK',
      'READY',
      'APPROVED',
      'SCHEDULED',
      'PUBLISHED',
      'MEASURED',
      'REFRESH',
      'ARCHIVED',
    ]);
  });

  it('walks the gate pipeline in order', () => {
    const path = [
      'DRAFT',
      'FACT_CHECK',
      'STYLE_CHECK',
      'BRAND_LEGAL_CHECK',
      'READY',
      'APPROVED',
      'SCHEDULED',
      'PUBLISHED',
      'MEASURED',
    ] as const;

    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransitionAsset(path[i], path[i + 1])).toBe(true);
    }
  });

  it('can send an asset back to the draft stage for repair', () => {
    expect(canTransitionAsset('FACT_CHECK', 'DRAFT')).toBe(true);
    expect(canTransitionAsset('BRAND_LEGAL_CHECK', 'DRAFT')).toBe(true);
  });

  it('blocks publishing a draft that never passed the gates', () => {
    expect(canTransitionAsset('DRAFT', 'PUBLISHED')).toBe(false);
    expect(planAssetTransition('DRAFT', 'PUBLISHED').ok).toBe(false);
  });

  it('loops a measured asset through refresh back to draft', () => {
    expect(canTransitionAsset('MEASURED', 'REFRESH')).toBe(true);
    expect(canTransitionAsset('REFRESH', 'DRAFT')).toBe(true);
  });

  it('treats ARCHIVED as terminal', () => {
    expect(isAssetTerminal('ARCHIVED')).toBe(true);
    expect(nextAssetStatuses('ARCHIVED')).toEqual([]);
    expect(() => assertAssetTransition('ARCHIVED', 'DRAFT')).toThrow(
      InvalidTransitionError,
    );
  });
});

describe('Transition tables', () => {
  it('never lists a transition to an unknown status', () => {
    const topicTargets = Object.values(TOPIC_TRANSITIONS).flat();
    const assetTargets = Object.values(ASSET_TRANSITIONS).flat();

    for (const target of topicTargets) {
      expect(GROWTH_TOPIC_STATUSES).toContain(target);
    }
    for (const target of assetTargets) {
      expect(CONTENT_ASSET_STATUSES).toContain(target);
    }
  });

  it('allows archiving from every non-terminal topic status', () => {
    const nonTerminalTopics = GROWTH_TOPIC_STATUSES.filter(
      (status) => status !== 'ARCHIVED',
    );
    for (const status of nonTerminalTopics) {
      expect(TOPIC_TRANSITIONS[status]).toContain('ARCHIVED');
    }
  });
});
