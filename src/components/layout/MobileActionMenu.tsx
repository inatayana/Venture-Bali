'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, SlidersHorizontal, Globe, DollarSign, Sun, Moon, ChevronDown, ChevronRight } from 'lucide-react';
import { useLocale } from '@/components/locale/LocaleProvider';
import { useCurrency } from '@/components/currency/CurrencyProvider';
import { useTheme } from '@/components/theme/ThemeProvider';
import { BRAND_EMAIL_HELLO } from '@/lib/brand';
import { ACTIVE_CURRENCY_INFO, type ActiveCurrency } from '@/lib/currency';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { cn } from '@/utils/cn';

/**
 * Mobile action menu - full-width bottom sheet for better proportionality on mobile.
 * Each row: full width, icon + label left, control right.
 * Consistent height (48px), background, hover, alignment.
 */
export function MobileActionMenu() {
  const [open, setOpen] = useState(false);
  const { locale, setLocale } = useLocale();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const closeMenu = () => setOpen(false);

  const nextLocale = locale === 'en' ? 'id' : 'en';

  const handleLocaleToggle = () => {
    setLocale(nextLocale);
    closeMenu();
  };

  const handleThemeToggle = () => {
    toggleTheme();
    closeMenu();
  };

  const handleCurrencySelect = (code: ActiveCurrency) => {
    setCurrency(code);
    closeMenu();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Settings"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
      >
        <SlidersHorizontal className="h-5 w-5 text-brand" aria-hidden="true" />
      </button>

      <BottomSheet
        isOpen={open}
        onClose={closeMenu}
        title="Settings"
        className="sm:max-w-sm"
      >
        <div className="space-y-1">
          {/* Language Row */}
          <button
            type="button"
            onClick={handleLocaleToggle}
            className={cn(
              'w-full flex min-h-[48px] items-center justify-between px-3 py-2 rounded-xl',
              'text-neutral-900 dark:text-white',
              'hover:bg-neutral-100 dark:hover:bg-white/10',
              'transition-colors'
            )}
          >
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
              <span className="text-sm font-medium">{locale === 'en' ? 'Language' : 'Bahasa'}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold tabular-nums">{locale.toUpperCase()}</span>
              <ChevronDown className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            </div>
          </button>

          {/* Currency Row with integrated dropdown */}
          <CurrencyRow
            selectedCurrency={currency}
            onCurrencyChange={handleCurrencySelect}
            closeMenu={closeMenu}
            locale={locale}
          />

          {/* Theme Row */}
          <button
            type="button"
            onClick={handleThemeToggle}
            className={cn(
              'w-full flex min-h-[48px] items-center justify-between px-3 py-2 rounded-xl',
              'text-neutral-900 dark:text-white',
              'hover:bg-neutral-100 dark:hover:bg-white/10',
              'transition-colors'
            )}
          >
            <div className="flex items-center gap-3">
              {isDark ? (
                <Sun className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
              )}
              <span className="text-sm font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold capitalize">{theme}</span>
              <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            </div>
          </button>

          {/* Email Row */}
          <a
            href={`mailto:${BRAND_EMAIL_HELLO}`}
            onClick={closeMenu}
            className={cn(
              'w-full flex min-h-[48px] items-center justify-between px-3 py-2 rounded-xl',
              'text-neutral-900 dark:text-white',
              'hover:bg-neutral-100 dark:hover:bg-white/10',
              'transition-colors'
            )}
          >
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
              <span className="text-sm font-medium">{locale === 'en' ? 'Contact' : 'Kontak'}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 truncate">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{BRAND_EMAIL_HELLO}</span>
              <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            </div>
          </a>
        </div>
      </BottomSheet>
    </>
  );
}

/**
 * Currency row with integrated dropdown.
 * Matches the unified settings row pattern.
 */
function CurrencyRow({
  selectedCurrency,
  onCurrencyChange,
  closeMenu,
  locale,
}: {
  selectedCurrency: ActiveCurrency;
  onCurrencyChange: (currency: ActiveCurrency) => void;
  closeMenu: () => void;
  locale: 'en' | 'id';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = ACTIVE_CURRENCY_INFO.find((c) => c.code === selectedCurrency);
  const label = locale === 'en' ? 'Currency' : 'Mata Uang';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex min-h-[48px] items-center justify-between px-3 py-2 rounded-xl',
          'text-neutral-900 dark:text-white',
          'hover:bg-neutral-100 dark:hover:bg-white/10',
          'transition-colors'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {selected?.flag} {selected?.code}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-neutral-400 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-950 rounded-xl shadow-lg border border-neutral-200 dark:border-white/10 py-1 z-50 max-h-60 overflow-y-auto"
          role="listbox"
        >
          {ACTIVE_CURRENCY_INFO.map((currency) => (
            <button
              key={currency.code}
              type="button"
              onClick={() => {
                onCurrencyChange(currency.code as ActiveCurrency);
                setIsOpen(false);
                closeMenu();
              }}
              className={cn(
                'flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                currency.code === selectedCurrency
                  ? 'bg-brand/40 text-brand-ink font-medium'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10'
              )}
              role="option"
              aria-selected={currency.code === selectedCurrency}
            >
              <span>{currency.flag}</span>
              <span>{currency.code}</span>
              <span className="text-gray-600 dark:text-gray-400 ml-auto text-xs">{currency.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}