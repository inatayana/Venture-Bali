/**
 * BaliWild — Growth Content State Machine
 * ----------------------------------------
 * Canonical lifecycle for growth topics and content assets.
 *
 * Pure functions only: this module never touches the database. Callers
 * persist the result and append an AuditEvent. That keeps the transitions
 * testable and prevents two agents from inventing different rules.
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §5
 */

export const GROWTH_TOPIC_STATUSES = [
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
] as const;

export type GrowthTopicStatus =
  (typeof GROWTH_TOPIC_STATUSES)[number];

export const CONTENT_ASSET_STATUSES = [
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
] as const;

export type ContentAssetStatus =
  (typeof CONTENT_ASSET_STATUSES)[number];

/**
 * Allowed forward transitions. A status not listed as a key is terminal.
 * `ARCHIVED` is terminal on purpose: nothing leaves the archive.
 */
export const TOPIC_TRANSITIONS: Record<
  GrowthTopicStatus,
  readonly GrowthTopicStatus[]
> = {
  DISCOVERED: ['TRIAGED', 'ARCHIVED'],
  TRIAGED: ['BRIEFED', 'ARCHIVED'],
  BRIEFED: ['IN_PRODUCTION', 'ARCHIVED'],
  IN_PRODUCTION: ['IN_REVIEW', 'BRIEFED', 'ARCHIVED'],
  IN_REVIEW: ['APPROVED', 'IN_PRODUCTION', 'ARCHIVED'],
  APPROVED: ['SCHEDULED', 'IN_PRODUCTION', 'ARCHIVED'],
  SCHEDULED: ['PUBLISHED', 'APPROVED', 'ARCHIVED'],
  PUBLISHED: ['MONITORED', 'ARCHIVED'],
  MONITORED: ['NEEDS_REFRESH', 'ARCHIVED'],
  NEEDS_REFRESH: ['BRIEFED', 'ARCHIVED'],
  ARCHIVED: [],
};

export const ASSET_TRANSITIONS: Record<
  ContentAssetStatus,
  readonly ContentAssetStatus[]
> = {
  DRAFT: ['FACT_CHECK', 'ARCHIVED'],
  FACT_CHECK: ['STYLE_CHECK', 'DRAFT', 'ARCHIVED'],
  STYLE_CHECK: ['BRAND_LEGAL_CHECK', 'DRAFT', 'ARCHIVED'],
  BRAND_LEGAL_CHECK: ['READY', 'DRAFT', 'ARCHIVED'],
  READY: ['APPROVED', 'DRAFT', 'ARCHIVED'],
  APPROVED: ['SCHEDULED', 'DRAFT', 'ARCHIVED'],
  SCHEDULED: ['PUBLISHED', 'APPROVED', 'ARCHIVED'],
  PUBLISHED: ['MEASURED', 'ARCHIVED'],
  MEASURED: ['REFRESH', 'ARCHIVED'],
  REFRESH: ['DRAFT'],
  ARCHIVED: [],
};

/** Thrown when a caller tries to move a row through a disallowed edge. */
export class InvalidTransitionError extends Error {
  readonly from: string;
  readonly to: string;

  constructor(from: string, to: string) {
    super(`Illegal growth state transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
  }
}

export function canTransition<T extends string>(
  table: Record<T, readonly T[]>,
  from: T,
  to: T,
): boolean {
  return table[from]?.includes(to) ?? false;
}

export function assertTransition<T extends string>(
  table: Record<T, readonly T[]>,
  from: T,
  to: T,
): void {
  if (!canTransition(table, from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export function planTransition<T extends string>(
  table: Record<T, readonly T[]>,
  from: T,
  to: T,
): TransitionPlan<T> {
  if (canTransition(table, from, to)) {
    return { ok: true, from, to, error: null };
  }

  return {
    ok: false,
    from,
    to,
    error: `Illegal growth state transition: ${from} → ${to}`,
  };
}

export function canTransitionTopic(
  from: GrowthTopicStatus,
  to: GrowthTopicStatus,
): boolean {
  return canTransition(TOPIC_TRANSITIONS, from, to);
}

export function canTransitionAsset(
  from: ContentAssetStatus,
  to: ContentAssetStatus,
): boolean {
  return canTransition(ASSET_TRANSITIONS, from, to);
}

export function assertTopicTransition(
  from: GrowthTopicStatus,
  to: GrowthTopicStatus,
): void {
  assertTransition(TOPIC_TRANSITIONS, from, to);
}

export function assertAssetTransition(
  from: ContentAssetStatus,
  to: ContentAssetStatus,
): void {
  assertTransition(ASSET_TRANSITIONS, from, to);
}

export function planTopicTransition(
  from: GrowthTopicStatus,
  to: GrowthTopicStatus,
): TransitionPlan<GrowthTopicStatus> {
  return planTransition(TOPIC_TRANSITIONS, from, to);
}

export function planAssetTransition(
  from: ContentAssetStatus,
  to: ContentAssetStatus,
): TransitionPlan<ContentAssetStatus> {
  return planTransition(ASSET_TRANSITIONS, from, to);
}

export function nextTopicStatuses(
  status: GrowthTopicStatus,
): readonly GrowthTopicStatus[] {
  return TOPIC_TRANSITIONS[status];
}

export function nextAssetStatuses(
  status: ContentAssetStatus,
): readonly ContentAssetStatus[] {
  return ASSET_TRANSITIONS[status];
}

export function isTopicTerminal(status: GrowthTopicStatus): boolean {
  return nextTopicStatuses(status).length === 0;
}

export function isAssetTerminal(status: ContentAssetStatus): boolean {
  return nextAssetStatuses(status).length === 0;
}

/** Every status a topic can legally occupy, in lifecycle order. */
export function listTopicStatuses(): readonly GrowthTopicStatus[] {
  return GROWTH_TOPIC_STATUSES;
}

/** Every status an asset can legally occupy, in lifecycle order. */
export function listAssetStatuses(): readonly ContentAssetStatus[] {
  return CONTENT_ASSET_STATUSES;
}

export interface TransitionPlan<S extends string> {
  readonly ok: boolean;
  readonly from: S;
  readonly to: S;
  readonly error: string | null;
}

// ---------------------------------------------------------------------------
// Content fingerprint for duplication detection
// ---------------------------------------------------------------------------

export interface ContentHashInput {
  title: string;
  slug: string;
  content: string;
  metaDesc: string;
  keywords: string[];
  tags: string[];
  ventureId?: string | null;
}

/**
 * Deterministic content fingerprint of article fields.
 * Same input → same hash; used to detect dupes across topics.
 * Uses Node Web Crypto when available (Node 22+), otherwise a small
 * fallback hash so the function stays testable everywhere.
 */
export async function computeContentHash(
  input: ContentHashInput,
): Promise<string> {
  const parts = [
    (input.title ?? '').trim(),
    (input.slug ?? '').trim().toLowerCase(),
    (input.content ?? '').trim(),
    (input.metaDesc ?? '').trim(),
    (input.keywords ?? []).slice().sort().join(','),
    (input.tags ?? []).slice().sort().join(','),
    (input.ventureId ?? '').trim(),
  ];
  const payload = parts.join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(payload);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback: deterministic string hash so the function stays pure & testable
  let h = 0;
  for (let i = 0; i < payload.length; i += 1) {
    const char = payload.charCodeAt(i);
    h = ((h << 5) - h + char) | 0; // eslint-disable-line no-bitwise
  }
  return (h < 0 ? ~h : h).toString(36);
}
