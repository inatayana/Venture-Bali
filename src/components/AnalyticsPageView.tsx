'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';
import { CONSENT_EVENT, hasAnalyticsConsent } from '@/lib/consent';

/** Fires one `page_view` per client-side route change, after analytics consent. */
export function AnalyticsPageView() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname || !hasAnalyticsConsent()) return;
    lastPath.current = pathname;
    track('page_view', { path: pathname });
  }, [pathname]);

  useEffect(() => {
    const onConsent = () => {
      if (!pathname) return;
      lastPath.current = pathname;
      track('page_view', { path: pathname });
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, [pathname]);

  return null;
}
