/**
 * Vendor-agnostic analytics.
 *
 * Events are pushed to `window.dataLayer` (GA4 / GTM compatible) and dispatched
 * as a `baliwild:analytics` DOM event, so any tool can pick them up later without a
 * dependency. Server-side calls are ignored.
 */

export interface AnalyticsPayload {
  [key: string]: unknown;
}

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

export function track(event: string, payload: AnalyticsPayload = {}): void {
  if (typeof window === 'undefined') return;

  const detail = { event, ...payload, timestamp: Date.now() };
  const target = window as DataLayerWindow;

  // Create the queue if GTM is not loaded yet; the GTM snippet reuses an existing
  // array, so events are not lost either way.
  if (!Array.isArray(target.dataLayer)) target.dataLayer = [];
  target.dataLayer.push(detail);

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', detail);
  }

  window.dispatchEvent(new CustomEvent('baliwild:analytics', { detail }));
  // Legacy event name kept for one release so existing listeners do not break.
  window.dispatchEvent(new CustomEvent('vb:analytics', { detail }));
}
