'use client';

import { Mail } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useLocale } from '@/components/locale/LocaleProvider';
import { BRAND_EMAIL_HELLO } from '@/lib/brand';

/** Global header for the home page: wordmark, tagline and locale/currency. */
export function HomeHeader() {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <p className="shrink-0 text-brand-ink">
            <BrandWordmark className="text-2xl" />
          </p>
          <p className="hidden truncate text-xs text-gray-500 lg:block">{t('headerTagline')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <LanguageSwitcher />
          <CurrencySelector />
          <ThemeSwitcher />
          <a
            href={`mailto:${BRAND_EMAIL_HELLO}`}
            className="hidden items-center gap-1.5 pl-1 text-xs font-semibold text-neutral-600 transition-colors hover:text-brand-ink md:inline-flex"
            aria-label={`Email ${BRAND_EMAIL_HELLO}`}
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">{BRAND_EMAIL_HELLO}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
