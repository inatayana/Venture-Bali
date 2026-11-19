'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hide header when scrolling down, show when scrolling up or pausing.
 * - Hide immediately on scroll down past threshold
 * - Show immediately on scroll up
 * - Also show after pause (no scroll for 150ms)
 * Always show at very top of page (y <= 16)
 */
export function useHideOnScroll(thresholdPx = 80, pauseMs = 150) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;

      const y = window.scrollY;
      const delta = y - lastY.current;
      
      // Always show at very top
      if (y <= 16) {
        setHidden(false);
        lastY.current = y;
        isScrollingRef.current = false;
        return;
      }

      if (Math.abs(delta) <= 10) {
        isScrollingRef.current = false;
        return; // ignore micro jitter
      }

      if (delta > 0 && y > thresholdPx) {
        setHidden(true);
      } else if (delta < 0) {
        setHidden(false);
      }

      // Reset pause timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setHidden(false);
      }, pauseMs);

      lastY.current = y;
      
      // Reset scrolling flag after RAF
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 0);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [thresholdPx, pauseMs]);

  return hidden;
}