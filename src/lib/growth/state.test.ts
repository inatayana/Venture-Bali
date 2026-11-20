import {
  canTransitionTopic,
  canTransitionAsset,
  assertTopicTransition,
  planTopicTransition,
  planAssetTransition,
  nextTopicStatuses,
  isTopicTerminal,
  isAssetTerminal,
  InvalidTransitionError,
  listTopicStatuses,
  listAssetStatuses,
} from './state';

describe('topic state machine', () => {
  it('allows the documented happy path', () => {
    expect(canTransitionTopic('DISCOVERED', 'TRIAGED')).toBe(true);
    expect(canTransitionTopic('TRIAGED', 'BRIEFED')).toBe(true);
    expect(canTransitionTopic('BRIEFED', 'IN_PRODUCTION')).toBe(true);
    expect(canTransitionTopic('IN_PRODUCTION', 'IN_REVIEW')).toBe(true);
    expect(canTransitionTopic('IN_REVIEW', 'APPROVED')).toBe(true);
    expect(canTransitionTopic('APPROVED', 'SCHEDULED')).toBe(true);
    expect(canTransitionTopic('SCHEDULED', 'PUBLISHED')).toBe(true);
    expect(canTransitionTopic('PUBLISHED', 'MONITORED')).toBe(true);
    expect(canTransitionTopic('MONITORED', 'NEEDS_REFRESH')).toBe(true);
    expect(canTransitionTopic('NEEDS_REFRESH', 'BRIEFED')).toBe(true);
  });

  it('rejects skipping the review gate', () => {
    expect(canTransitionTopic('IN_PRODUCTION', 'APPROVED')).toBe(false);
    expect(canTransitionTopic('DISCOVERED', 'PUBLISHED')).toBe(false);
    expect(canTransitionTopic('TRIAGED', 'PUBLISHED')).toBe(false);
  });

  it('treats ARCHIVED as terminal', () => {
    expect(nextTopicStatuses('ARCHIVED')).toEqual([]);
    expect(isTopicTerminal('ARCHIVED')).toBe(true);
    expect(isTopicTerminal('PUBLISHED')).toBe(false);
  });

  it('throws on an illegal transition', () => {
    expect(() => assertTopicTransition('DISCOVERED', 'PUBLISHED')).toThrow(InvalidTransitionError);
  });

  it('plans a transition without throwing', () => {
    const ok = planTopicTransition('TRIAGED', 'BRIEFED');
    expect(ok).toEqual({ ok: true, from: 'TRIAGED', to: 'BRIEFED', error: null });

    const bad = planTopicTransition('DISCOVERED', 'PUBLISHED');
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/Illegal growth state transition/);
  });

  it('exposes every status in lifecycle order', () => {
    const statuses = listTopicStatuses();
    expect(statuses[0]).toBe('DISCOVERED');
    expect(statuses[statuses.length - 1]).toBe('ARCHIVED');
  });
});

describe('asset state machine', () => {
  it('allows DRAFT → FACT_CHECK → STYLE_CHECK → BRAND_LEGAL_CHECK → READY', () => {
    expect(canTransitionAsset('DRAFT', 'FACT_CHECK')).toBe(true);
    expect(canTransitionAsset('FACT_CHECK', 'STYLE_CHECK')).toBe(true);
    expect(canTransitionAsset('STYLE_CHECK', 'BRAND_LEGAL_CHECK')).toBe(true);
    expect(canTransitionAsset('BRAND_LEGAL_CHECK', 'READY')).toBe(true);
    expect(canTransitionAsset('READY', 'APPROVED')).toBe(true);
  });

  it('rejects publishing an unapproved draft', () => {
    expect(canTransitionAsset('DRAFT', 'PUBLISHED')).toBe(false);
    expect(canTransitionAsset('READY', 'SCHEDULED')).toBe(false);
  });

  it('allows REFRESH to loop back to DRAFT only', () => {
    const plan = planAssetTransition('REFRESH', 'DRAFT');
    expect(plan.ok).toBe(true);
    expect(canTransitionAsset('REFRESH', 'PUBLISHED')).toBe(false);
  });

  it('treats ARCHIVED as terminal', () => {
    expect(isAssetTerminal('ARCHIVED')).toBe(true);
  });

  it('exposes every asset status', () => {
    const statuses = listAssetStatuses();
    expect(statuses[0]).toBe('DRAFT');
    expect(statuses[statuses.length - 1]).toBe('ARCHIVED');
  });
});