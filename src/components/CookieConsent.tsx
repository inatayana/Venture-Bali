'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { CONSENT_EVENT, getStoredConsent, setStoredConsent, type ConsentValue } from '@/lib/consent';

/**
 * Minimal, brand-styled consent banner. Analytics stays off until "Accept all";
 * essential storage (cart/checkout/security) is always allowed.
 */
export function CookieConsent() {
  const [value, setValue] = useState<ConsentValue | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setValue(getStoredConsent());
    setReady(true);

    const onConsent = () => setValue(getStoredConsent());
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!ready || value) return null;

  const choose = (next: ConsentValue) => {
    setStoredConsent(next);
    setValue(next);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="relative mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/15 bg-brand-ink p-4 text-white shadow-2xl sm:flex-row sm:items-center">
        <Cookie className="hidden h-5 w-5 shrink-0 text-brand sm:block" aria-hidden="true" />
        <p className="flex-1 text-xs leading-relaxed text-white/75">
          We use essential cookies to run checkout and optional analytics to improve BaliWild.
          Read our{' '}
          <Link href="/privacy" className="font-semibold text-brand underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose('essential')}
            className="min-h-[40px] rounded-lg border border-white/20 px-3 text-xs font-semibold text-white/80 hover:border-white/40"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose('all')}
            className="min-h-[40px] rounded-lg bg-brand px-4 text-xs font-bold uppercase tracking-wider text-brand-ink"
          >
            Accept all
          </button>
        </div>
        <button
          type="button"
          onClick={() => choose('essential')}
          aria-label="Dismiss and use essential cookies only"
          className="absolute right-2 top-2 rounded-full p-1.5 text-white/50 hover:text-white sm:static"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
