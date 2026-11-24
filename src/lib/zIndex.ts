/**
 * Z-Index Token System
 * Single source of truth for all stacking contexts.
 * Use these constants in both CSS and TypeScript to avoid drift.
 */

export const Z_INDEX = {
  /** Toast notifications — highest, temporary, must be visible */
  toast: 80,

  /** Modal dialogs — booking confirmation, image lightbox, etc. */
  modal: 70,

  /** Bottom sheets — checkout, booking flow, filters */
  bottomSheet: 65,

  /** Popovers — mobile settings menu, dropdowns, tooltips */
  popover: 60,

  /** Cookie consent banner — must be above bottom nav for compliance */
  cookie: 55,

  /** Sticky CTA on detail pages — price + "Show dates" */
  stickyCTA: 50,

  /** Bottom navigation — App Shell global navigation */
  bottomNav: 45,

  /** Header (auto-hide on scroll) */
  header: 40,

  /** Content base layer */
  content: 10,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;

/**
 * CSS variable mapping for use in globals.css
 * Prefix with --z- to avoid collision with Tailwind's z-*
 */
export const Z_INDEX_CSS_VARS: Record<ZIndexKey, string> = {
  toast: '--z-toast',
  modal: '--z-modal',
  bottomSheet: '--z-bottom-sheet',
  popover: '--z-popover',
  cookie: '--z-cookie',
  stickyCTA: '--z-sticky-cta',
  bottomNav: '--z-bottom-nav',
  header: '--z-header',
  content: '--z-content',
} as const;