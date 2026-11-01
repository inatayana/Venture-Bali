'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';

/** Fires one `page_view` per client-side route change. */
export function AnalyticsPageView() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    track('page_view', { path: pathname });
  }, [pathname]);

  return null;
}
