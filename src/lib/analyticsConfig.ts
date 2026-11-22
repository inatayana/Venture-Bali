/**
 * Analytics destination configuration.
 *
 * BaliWild pushes events to `window.dataLayer` and dispatches
 * `baliwild:analytics`. Without a destination configured those events stay in
 * memory — useful for debugging, useless for growth. Exactly one destination
 * is active at a time to avoid double-counted page views:
 *
 * - GTM: the container consumes `dataLayer` directly (put the GA4 tag in GTM).
 * - GA4: gtag.js is loaded and `baliwild:analytics` events are forwarded to it.
 */

export interface AnalyticsConfig {
  gtmId: string | null;
  gaId: string | null;
}

export function getAnalyticsConfig(): AnalyticsConfig {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || null;
  const gaId = gtmId ? null : process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || null;
  return { gtmId, gaId };
}
