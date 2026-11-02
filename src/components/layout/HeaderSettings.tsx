'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { BottomSheet } from '@/components/ui';
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';

/**
 * One 44px trigger on mobile; language, currency and theme live inside the
 * sheet so the header never has four competing tap targets.
 */
export function HeaderSettings() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open language, currency and theme settings"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </button>

      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Preferences">
        <div className="space-y-5 pb-2">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Language
            </h3>
            <div className="mt-2">
              <LanguageSwitcher />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Currency
            </h3>
            <p className="mt-1 text-xs text-neutral-600">
              Charged in IDR. Other currencies are approximate.
            </p>
            <div className="mt-2">
              <CurrencySelector />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Theme
            </h3>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 dark:border-white/15">
              <span className="text-sm text-neutral-700">Light / dark mode</span>
              <ThemeSwitcher />
            </div>
          </section>
        </div>
      </BottomSheet>
    </>
  );
}
