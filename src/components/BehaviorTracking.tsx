'use client';

import { useEffect } from 'react';
import { initBehaviorTracking } from '@/lib/analytics';

/**
 * Initializes Hotjar / Microsoft Clarity behavior tracking.
 * Only runs on client side after analytics consent.
 */
export function BehaviorTracking() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize Hotjar / Clarity
    initBehaviorTracking();

    // Listen for consent changes to initialize tracking
    const onConsent = () => {
      initBehaviorTracking();
    };

    window.addEventListener('baliwild:consent', onConsent);
    return () => window.removeEventListener('baliwild:consent', onConsent);
  }, []);

  return null;
}