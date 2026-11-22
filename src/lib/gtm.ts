/**
 * Google Tag Manager helpers.
 *
 * The container id lives in `NEXT_PUBLIC_GTM_ID` ([PUBLIC], safe for the
 * browser). An empty/absent value means "no tag manager" and the loader must
 * stay dormant — the vendor-agnostic `track()` in `@/lib/analytics` then only
 * writes to the shared `dataLayer` queue, which any future sink can pick up.
 */

export const GOOGLE_TAG_MANAGER_SRC = 'https://www.googletagmanager.com/gtm.js';

export function getGoogleTagManagerId(): string | null {
  const id = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  return id ? id : null;
}

export function isGoogleTagManagerConfigured(): boolean {
  return getGoogleTagManagerId() !== null;
}

export function googleTagManagerScript(id: string): HTMLScriptElement {
  const script = document.createElement('script');
  script.id = `gtm-${id}`;
  script.async = true;
  script.src = `${GOOGLE_TAG_MANAGER_SRC}?id=${id}`;
  return script;
}
