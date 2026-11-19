'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Airbnb-style hide-on-scroll: hide past the threshold on scroll down,
 * reveal on any scroll up (and at the very top). 10px jitter threshold.
 */
export function useHideOnScroll(thresholdPx = 80, topOffset = 16) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let raf = 0;

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (Math.abs(delta) <= 10) return;
        if (delta > 0 && y > thresholdPx) {
          setHidden(true);
        } else if (delta < 0 || y <= topOffset) {
          setHidden(false);
        }
        lastY.current = y;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(raf);
    };
  }, [thresholdPx, topOffset]);

  return hidden;
}
