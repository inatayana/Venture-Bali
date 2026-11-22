'use client';

import { useEffect, useRef } from 'react';
import { CONSENT_EVENT, hasAnalyticsConsent } from '@/lib/consent';
import { getGoogleTagManagerId, googleTagManagerScript } from '@/lib/gtm';

/**
 * Consent-gated Google Tag Manager loader.
 *
 * Injects the standard GTM snippet (`https://www.googletagmanager.com/gtm.js?id=…`)
 * into `<head>` only when a container id is configured (`NEXT_PUBLIC_GTM_ID`) and
 * the visitor granted analytics consent. Events emitted by `@/lib/analytics` are
 * pushed to the shared `window.dataLayer` and are picked up by GTM automatically.
 *
 * Renders nothing — mounted once in the root layout next to `AnalyticsPageView`.
 */
export function GoogleTagManager() {
  const injectedIdRef = useRef<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const sync = () => {
      const id = getGoogleTagManagerId();
      const granted = hasAnalyticsConsent();

      if (!granted) {
        if (injectedIdRef.current) {
          scriptRef.current?.remove();
          scriptRef.current = null;
          injectedIdRef.current = null;
        }
        return;
      }

      if (!id || injectedIdRef.current === id) return;
      injectedIdRef.current = id;
      const script = googleTagManagerScript(id);
      scriptRef.current = script;
      document.head.appendChild(script);
    };

    sync();

    const onConsent = () => sync();
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  return null;
}
