'use client';

import { useState } from 'react';
import { Mail, SlidersHorizontal } from 'lucide-react';
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useLocale } from '@/components/locale/LocaleProvider';
import { BRAND_EMAIL_HELLO } from '@/lib/brand';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui';

/**
 * Mobile action menu using controlled Popover (no body scroll lock).
 * Single trigger icon opens a floating menu with Language, Currency, Theme, Email.
 * Menu closes automatically when an action is selected.
 */
export function MobileActionMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  const closeMenu = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${t('nav', 'language') || 'Language'} / ${t('nav', 'currency') || 'Currency'} / ${t('nav', 'theme') || 'Theme'}`}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 shadow-xl backdrop-blur-sm" side="bottom" align="end">
        <div className="space-y-3">
          {/* Language */}
          <section>
            <h4 className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {t('nav', 'language') || 'Language'}
            </h4>
            <LanguageSwitcher className="w-full justify-center" onLocaleChange={closeMenu} />
          </section>

          {/* Currency */}
          <section>
            <h4 className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {t('nav', 'currency') || 'Currency'}
            </h4>
            <CurrencySelector className="w-full justify-center" onCurrencyChange={closeMenu} />
          </section>

          {/* Theme */}
          <section>
            <h4 className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {t('nav', 'theme') || 'Theme'}
            </h4>
            <ThemeSwitcher className="w-full justify-center" onThemeChange={closeMenu} />
          </section>

          {/* Email */}
          <section>
            <h4 className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {t('nav', 'contact') || 'Contact'}
            </h4>
            <a
              href={`mailto:${BRAND_EMAIL_HELLO}`}
              onClick={closeMenu}
              className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-neutral-900 dark:text-white transition-colors hover:bg-neutral-100 dark:hover:bg-white/10 rounded-xl"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{BRAND_EMAIL_HELLO}</span>
            </a>
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}