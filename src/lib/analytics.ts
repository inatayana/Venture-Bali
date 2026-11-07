import { hasAnalyticsConsent } from './consent';

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
  if (!hasAnalyticsConsent()) return;

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

/** GA4 Enhanced Ecommerce event helpers */
export const ecommerce = {
  /** View a product detail page */
  viewItem: (item: {
    item_id: string;
    item_name: string;
    item_category: string;
    price_idr: number;
    currency?: string;
  }) => track('view_item', {
    currency: item.currency || 'IDR',
    value: item.price_idr,
    items: [{ item_id: item.item_id, item_name: item.item_name, item_category: item.item_category, price: item.price_idr, quantity: 1 }],
  }),

  /** Add item to cart (when user clicks "Show dates" / starts booking) */
  addToCart: (item: {
    item_id: string;
    item_name: string;
    item_category: string;
    price_idr: number;
    quantity: number;
  }) => track('add_to_cart', {
    currency: 'IDR',
    value: item.price_idr * item.quantity,
    items: [{ item_id: item.item_id, item_name: item.item_name, item_category: item.item_category, price: item.price_idr, quantity: item.quantity }],
  }),

  /** Begin checkout (step 1: guest details) */
  beginCheckout: (items: Array<{
    item_id: string;
    item_name: string;
    item_category: string;
    price_idr: number;
    quantity: number;
  }>, totalValue: number) => track('begin_checkout', {
    currency: 'IDR',
    value: totalValue,
    items,
  }),

  /** Add payment info (step 2: payment method selected) */
  addPaymentInfo: (paymentMethod: string) => track('add_payment_info', {
    payment_type: paymentMethod,
  }),

  /** Purchase completed */
  purchase: (params: {
    transaction_id: string;
    value: number;
    currency: string;
    items: Array<{ item_id: string; item_name: string; item_category: string; price: number; quantity: number }>;
  }) => track('purchase', {
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency,
    items: params.items,
  }),
};

/** Initialize Hotjar / Microsoft Clarity */
export function initBehaviorTracking(): void {
  if (typeof window === 'undefined') return;

  // Hotjar
  if (process.env.NEXT_PUBLIC_HOTJAR_ID) {
    const win = window as Window & { hj?: ((...args: unknown[]) => void) & { q?: unknown[] }; _hjSettings?: { hjid: string; hjsv: number } };
    const hj = win.hj || function (...args: unknown[]) { (win.hj!.q = win.hj!.q || []).push(args); };
    win.hj = hj;
    win._hjSettings = { hjid: process.env.NEXT_PUBLIC_HOTJAR_ID, hjsv: 6 };
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://static.hotjar.com/c/hotjar-${process.env.NEXT_PUBLIC_HOTJAR_ID}.js?sv=6`;
    document.head.appendChild(script);
  }

  // Microsoft Clarity (alternative to Hotjar)
  if (process.env.NEXT_PUBLIC_CLARITY_ID) {
    const win = window as Window & { clarity?: (event: string, data: string) => void; clarityQ?: unknown[] };
    win.clarity = function (event: string, data: string) {
      win.clarityQ = win.clarityQ || [];
      win.clarityQ.push([event, data]);
    };
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${process.env.NEXT_PUBLIC_CLARITY_ID}`;
    document.head.appendChild(script);
  }
}
