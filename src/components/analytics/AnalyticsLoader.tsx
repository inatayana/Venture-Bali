'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getAnalyticsConfig } from '@/lib/analyticsConfig';
import { CONSENT_EVENT, getStoredConsent } from '@/lib/consent';

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

/**
 * Loads the configured analytics destination only after "Accept all" consent.
 * Events are produced by `src/lib/analytics.ts`; this component only wires the
 * consumer. It never invents or retries events on its own.
 */
export function AnalyticsLoader() {
  const { gtmId, gaId } = getAnalyticsConfig();
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const sync = () => setConsented(getStoredConsent() === 'all');
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!consented || !gaId) return;

    const forward = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail;
      if (!detail || typeof detail.event !== 'string') return;
      const gtag = (window as GtagWindow).gtag;
      if (typeof gtag !== 'function') return;
      const { event: name, ...payload } = detail;
      gtag('event', name, payload);
    };

    window.addEventListener('baliwild:analytics', forward);
    return () => window.removeEventListener('baliwild:analytics', forward);
  }, [consented, gaId]);

  if (!consented || (!gtmId && !gaId)) return null;

  return (
    <>
      {gtmId ? (
        <Script id="baliwild-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      ) : null}

      {gaId ? (
        <>
          <Script
            id="baliwild-gtag-js"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="baliwild-gtag-config" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false});`}
          </Script>
        </>
      ) : null}
    </>
  );
}
