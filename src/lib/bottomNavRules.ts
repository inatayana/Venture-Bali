/**
 * Bottom Navigation Visibility Rules
 * Centralized route matching for when bottom nav should be hidden.
 * Split into transactional (HIDDEN) and immersive (IMMERSIVE) categories.
 */

export type BottomNavRouteType = 'HIDDEN' | 'IMMERSIVE' | 'VISIBLE';

export interface BottomNavRouteRule {
  pattern: RegExp;
  type: BottomNavRouteType;
  description: string;
}

/**
 * Routes where bottom nav MUST be hidden (transactional flows).
 * Bottom nav is replaced by contextual sticky CTA or flow-specific controls.
 */
export const HIDDEN_ROUTES: BottomNavRouteRule[] = [
  // Activity Detail & Review
  { pattern: /^\/experiences\/[^/]+\/[^/]+$/, type: 'HIDDEN', description: 'Activity Detail (PDP)' },
  { pattern: /^\/experiences\/[^/]+\/[^/]+\/review/, type: 'HIDDEN', description: 'Review Flow' },

  // Transactional
  { pattern: /^\/checkout\//, type: 'HIDDEN', description: 'Checkout Flow' },
  { pattern: /^\/booking\//, type: 'HIDDEN', description: 'Booking Legacy' },
  { pattern: /^\/review\//, type: 'HIDDEN', description: 'Review Standalone' },

  // Auth & Admin
  { pattern: /^\/admin\//, type: 'HIDDEN', description: 'Admin Area' },
  { pattern: /^\/login/, type: 'HIDDEN', description: 'Login Pages' },
  { pattern: /^\/register/, type: 'HIDDEN', description: 'Register Pages' },
  { pattern: /^\/forgot-password/, type: 'HIDDEN', description: 'Password Reset' },

  // Voucher & Waiver
  { pattern: /^\/voucher\//, type: 'HIDDEN', description: 'Voucher Verification' },
  { pattern: /^\/waiver/, type: 'HIDDEN', description: 'Waiver Signing' },
];

/**
 * Routes where bottom nav is hidden for immersive experience.
 * These may have their own navigation controls (e.g., map full-screen).
 */
export const IMMERSIVE_ROUTES: BottomNavRouteRule[] = [
  { pattern: /^\/map/, type: 'IMMERSIVE', description: 'Full-screen Map' },
];

/**
 * Combined rules for evaluation.
 * Order matters: HIDDEN checked first, then IMMERSIVE.
 */
export const BOTTOM_NAV_RULES = [
  ...HIDDEN_ROUTES,
  ...IMMERSIVE_ROUTES,
] as const;

/**
 * Check if bottom nav should be hidden for a given pathname.
 * Returns the rule type if hidden, 'VISIBLE' otherwise.
 */
export function getBottomNavVisibility(pathname: string): 'HIDDEN' | 'IMMERSIVE' | 'VISIBLE' {
  for (const rule of BOTTOM_NAV_RULES) {
    if (rule.pattern.test(pathname)) {
      return rule.type;
    }
  }
  return 'VISIBLE';
}

/**
 * Check if bottom nav should be completely hidden (not just immersive).
 */
export function shouldHideBottomNav(pathname: string): boolean {
  return getBottomNavVisibility(pathname) === 'HIDDEN';
}

/**
 * Active tab matching rules.
 * Uses prefix matching for grouped routes.
 */
export function getActiveBottomNavKey(pathname: string): string | null {
  // Exact matches first
  if (pathname === '/explore' || pathname === '/') return 'explore';
  if (pathname === '/search') return 'search';

  // Prefix matches
  if (pathname.startsWith('/trips')) return 'trips';
  if (pathname.startsWith('/profile')) return 'profile';

  return null;
}