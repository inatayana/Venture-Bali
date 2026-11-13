'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, SlidersHorizontal, Globe, DollarSign, Sun, Moon, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useLocale } from '@/components/locale/LocaleProvider';
import { useCurrency } from '@/components/currency/CurrencyProvider';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useWishlist } from '@/store/wishlistStore';
import { BRAND_EMAIL_HELLO } from '@/lib/brand';
import { ACTIVE_CURRENCY_INFO, type ActiveCurrency } from '@/lib/currency';
import { cn } from '@/utils/cn';

/**
 * Mobile dropdown menu - appears as a card below the header/burger menu.
 * Full width on mobile, smooth slide-down animation.
 * Inspired by Airbnb's mobile navigation pattern.
 */
export function MobileNavDropdown() {
  const { locale, setLocale } = useLocale();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const clearWishlist = useWishlist((state) => state.clear);
  
  const [open, setOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setOpen(false);
    setCurrencyDropdownOpen(false);
  };

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
    setCurrencyDropdownOpen(false);
    closeMenu();
  };

  const handleSignOut = () => {
    clearWishlist();
    closeMenu();
  };

  // Close on outside click and Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      if (isOutsideMenu && isOutsideDropdown) {
        closeMenu();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Currency dropdown click outside
  useEffect(() => {
    if (!currencyDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currencyDropdownOpen]);

  // Body scroll lock when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const dropdownContent = (
    <div
      ref={dropdownRef}
      id="mobile-nav-dropdown"
      role="menu"
      aria-label="Mobile navigation"
      className={cn(
        'fixed left-0 right-0 z-[60] w-full bg-white dark:bg-neutral-950 shadow-lg',
        'border-b border-neutral-200 dark:border-white/10',
        'animate-slide-down',
        open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      )}
      style={{
        top: headerRef.current ? headerRef.current.getBoundingClientRect().bottom : 'var(--header-height, 64px)',
      }}
    >
      <div className="p-4 space-y-3">
        {/* Language Row */}
        <button
          type="button"
          onClick={handleLocaleToggle}
          className={cn(
            'w-full flex min-h-[48px] items-center justify-between px-4 py-3 rounded-xl',
            'text-neutral-900 dark:text-white',
            'hover:bg-neutral-100 dark:hover:bg-white/10',
            'transition-colors'
          )}
        >
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
            <span className="text-base font-medium">{locale === 'en' ? 'Language' : 'Bahasa'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold tabular-nums">{locale.toUpperCase()}</span>
            <ChevronDown className="h-4 w-4 text-neutral-400" aria-hidden="true" />
          </div>
        </button>

        {/* Currency Row */}
        <MobileCurrencyRow
          selectedCurrency={currency}
          onCurrencyChange={handleCurrencySelect}
          locale={locale}
        />

        {/* Theme Row */}
        <button
          type="button"
          onClick={handleThemeToggle}
          className={cn(
            'w-full flex min-h-[48px] items-center justify-between px-4 py-3 rounded-xl',
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
            <span className="text-base font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
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
            'w-full flex min-h-[48px] items-center justify-between px-4 py-3 rounded-xl',
            'text-neutral-900 dark:text-white',
            'hover:bg-neutral-100 dark:hover:bg-white/10',
            'transition-colors'
          )}
        >
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
            <span className="text-base font-medium">{locale === 'en' ? 'Contact' : 'Kontak'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 truncate">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{BRAND_EMAIL_HELLO}</span>
            <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden="true" />
          </div>
        </a>

        {/* Sign Out */}
        <div className="pt-2 border-t border-neutral-200 dark:border-white/10" />
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex min-h-[48px] items-center justify-between px-4 py-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors font-medium"
        >
          <div className="flex items-center gap-3">
            <X className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
            <span className="text-base font-medium">Log out</span>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div ref={headerRef} className="relative md:hidden">
        {/* Mobile: Burger menu button */}
        <button
          ref={menuRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls="mobile-nav-dropdown"
          aria-label="Open navigation menu"
          className={cn(
            'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
            'border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10',
            open && 'bg-neutral-100 dark:bg-white/10'
          )}
        >
          <SlidersHorizontal className="h-5 w-5 text-brand" aria-hidden="true" />
        </button>
      </div>

      {open && createPortal(dropdownContent, document.body)}
    </>
  );
}

/**
 * Currency row with integrated dropdown for mobile dropdown menu.
 */
function MobileCurrencyRow({
  selectedCurrency,
  onCurrencyChange,
  locale,
}: {
  selectedCurrency: ActiveCurrency;
  onCurrencyChange: (currency: ActiveCurrency) => void;
  locale: 'en' | 'id';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = ACTIVE_CURRENCY_INFO.find((c) => c.code === selectedCurrency);
  const label = locale === 'en' ? 'Currency' : 'Mata Uang';

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex min-h-[48px] items-center justify-between px-4 py-3 rounded-xl',
          'text-neutral-900 dark:text-white',
          'hover:bg-neutral-100 dark:hover:bg-white/10',
          'transition-colors'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
          <span className="text-base font-medium">{label}</span>
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
          className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-neutral-950 rounded-xl shadow-lg border border-neutral-200 dark:border-white/10 py-1 z-50 max-h-60 overflow-y-auto"
          role="listbox"
        >
          {ACTIVE_CURRENCY_INFO.map((currency) => (
            <button
              key={currency.code}
              type="button"
              onClick={() => {
                onCurrencyChange(currency.code as ActiveCurrency);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex min-h-[44px] items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
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