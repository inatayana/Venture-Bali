/**
 * BaliWild — Growth Phase 2: Format Registry
 * -------------------------------------------
 * Barrel export for all multi-format generators plus payload interfaces.
 *
 * Docs: docs/CONTENT_GROWTH_ARCHITECT.md §2 (Phase 2 — multi-format)
 */

export {
  generateVideoScript,
  type VideoScriptPayload,
} from './videoScript';
export { generateShortHook, type ShortHookPayload } from './shortHook';
export { generateSocialPost, type SocialPostPayload } from './socialPost';
export { generateFaqBlock, type FaqBlockPayload, type FaqItem } from './faqBlock';

/** The format identifiers supported by the Phase 2 multi-format producer. */
export type GrowthFormat = 'VIDEO_SCRIPT' | 'SHORT_HOOK' | 'SOCIAL_POST' | 'FAQ_BLOCK';
