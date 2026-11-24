'use client';

import { useEffect, useState } from 'react';

/**
 * Shared sticky-header behaviour for the desktop header and the mobile
 * explore control bar.
 *
 * - Hide the bar while the guest is actively scrolling past `thresholdPx`.
 * - Reveal it again once scrolling pauses for `pauseMs`.
 * - Always stay visible at the very top of the page (scrollY <= 16).
 */
export function useHideOnScroll(thresholdPx = 80, pauseMs = 150) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const onScroll = () => {
      const y = window.scrollY;

      // Never hide near the top of the page.
      if (y <= Math.max(thresholdPx, 16)) {
        clearTimer();
        setHidden(false);
        return;
      }

      // Actively scrolling -> hide.
      setHidden(true);

      // Scrolling paused -> reveal again.
      clearTimer();
      timer = setTimeout(() => {
        timer = null;
        setHidden(false);
      }, pauseMs);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimer();
    };
  }, [thresholdPx, pauseMs]);

  return hidden;
}
