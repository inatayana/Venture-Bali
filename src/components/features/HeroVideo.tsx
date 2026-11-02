'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

/**
 * Cinematic hero background.
 *
 * The poster is always rendered, so the hero never depends on the video. The
 * video is only requested on desktop, after idle, when the guest allows motion
 * and is not on a save-data connection. Drop `public/videos/hero.mp4` in place;
 * until then the poster is the whole background.
 */
export function HeroVideo() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const saveData = connection?.saveData === true;
    const slowNetwork = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
    const desktop = window.matchMedia('(min-width: 768px)').matches;

    if (reducedMotion || saveData || slowNetwork || !desktop) return;

    let cancelled = false;
    // Check first so a missing file never produces a visible 404/video element.
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/videos/hero.mp4', { method: 'HEAD' });
        if (!cancelled && response.ok) setEnabled(true);
      } catch {
        /* poster remains */
      }
    }, 1400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <Image
        src="/images/hero-bali.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        quality={80}
        className="object-cover object-center opacity-70"
      />

      {enabled && !failed && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/hero-bali.jpg"
          tabIndex={-1}
          disablePictureInPicture
          onCanPlay={() => setReady(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-700 ${
            ready ? 'opacity-70' : ''
          }`}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
