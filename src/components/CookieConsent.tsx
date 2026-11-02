'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { CONSENT_EVENT, getStoredConsent, setStoredConsent, type ConsentValue } from '@/lib/consent';

/**
 * Minimal, brand-styled consent bar.
 *
 * Analytics stays off until "Accept all"; essential storage (cart/checkout/
 * security) is always allowed. The bar publishes its height as
 * `--cookie-consent-height` so fixed CTAs can sit above it, and it hides while
 * any dialog/sheet is open so it can never cover a booking action.
 */
export function CookieConsent() {
  const [value, setValue] = useState<ConsentValue | null>(null);
  const [ready, setReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(getStoredConsent());
    setReady(true);

    const onConsent = () => setValue(getStoredConsent());
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  // Suppress the bar whenever a modal / bottom sheet is on screen.
  useEffect(() => {
    const sync = () => setDialogOpen(Boolean(document.querySelector('[role="dialog"]')));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'aria-hidden'],
    });
    return () => observer.disconnect();
  }, []);

  const visible = ready && !value && !dialogOpen;

  // Keep fixed page CTAs clear of the bar instead of overlapping them.
  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      root.style.removeProperty('--cookie-consent-height');
      return;
    }

    const sync = () => {
      const height = barRef.current?.offsetHeight ?? 0;
      root.style.setProperty('--cookie-consent-height', `${height + 12}px`);
    };

    sync();
    const resizeObserver =
      typeof ResizeObserver === 'function' ? new ResizeObserver(sync) : null;
    if (barRef.current) resizeObserver?.observe(barRef.current);
    window.addEventListener('resize', sync);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', sync);
      root.style.removeProperty('--cookie-consent-height');
    };
  }, [visible]);

  if (!visible) return null;

  const choose = (next: ConsentValue) => {
    setStoredConsent(next);
    setValue(next);
  };

  return (
    <div
      ref={barRef}
      data-cookie-consent
      className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
    >
      <div className="relative mx-auto flex max-w-2xl items-center gap-2 rounded-xl border border-white/15 bg-brand-ink/95 px-3 py-2 text-white shadow-2xl backdrop-blur sm:gap-3 sm:px-4">
        <Cookie className="hidden h-4 w-4 shrink-0 text-brand sm:block" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-xs leading-snug text-white/80">
          <span className="sm:hidden">
            Essential cookies only.{' '}
            <Link href="/privacy" className="px-1 py-[15px] font-semibold text-brand underline underline-offset-2">
              Privacy
            </Link>
          </span>
          <span className="hidden sm:inline">
            Essential cookies run checkout; optional analytics help us improve.{' '}
            <Link href="/privacy" className="px-1 py-[15px] font-semibold text-brand underline underline-offset-2">
              Privacy policy
            </Link>
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => choose('essential')}
            className="min-h-[44px] rounded-lg border border-white/20 px-2.5 text-xs font-semibold text-white/80 hover:border-white/40"
          >
            Essential
          </button>
          <button
            type="button"
            onClick={() => choose('all')}
            className="min-h-[44px] rounded-lg bg-brand px-3 text-xs font-bold uppercase tracking-wider text-brand-ink"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => choose('essential')}
            aria-label="Dismiss and use essential cookies only"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
