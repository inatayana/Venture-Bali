'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  CalendarDays,
  DollarSign,
  Globe,
  Heart,
  HelpCircle,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  Sun,
  User,
} from 'lucide-react';
import { useLocale } from '@/components/locale/LocaleProvider';
import { useCurrency } from '@/components/currency/CurrencyProvider';
import { useTheme } from '@/components/theme/ThemeProvider';
import { getNamespace } from '@/lib/i18n-unified';
import { useWishlist } from '@/store/wishlistStore';
import { ACTIVE_CURRENCY_INFO, type ActiveCurrency } from '@/lib/currency';
import { cn } from '@/utils/cn';
import { LanguageCurrencyModal } from '@/components/ui/LanguageCurrencyModal';
import { Z_INDEX } from '@/lib/zIndex';

type MenuItem =
  | { href: string; labelKey: string; icon: React.ComponentType<{ className?: string }>; isAction?: false; isModalTrigger?: false; isSettings?: false }
  | { labelKey: string; icon: React.ComponentType<{ className?: string }>; isAction: true }
  | { labelKey: string; icon: React.ComponentType<{ className?: string }>; isModalTrigger: true }
  | { labelKey: string; icon: React.ComponentType<{ className?: string }>; isSettings: true };

type MenuGroup = { items: readonly MenuItem[] };

const MENU_GROUPS: readonly MenuGroup[] = [
  {
    items: [
      { href: '/wishlists', labelKey: 'wishlist', icon: Heart },
      { href: '/trips', labelKey: 'trips', icon: CalendarDays },
      { href: '/messages', labelKey: 'messages', icon: MessageSquare },
      { href: '/profile', labelKey: 'profile', icon: User },
      { href: '/notifications', labelKey: 'notifications', icon: Bell },
    ],
  },
  {
    items: [
      { labelKey: 'accountSettings', icon: Settings, isSettings: true },
      { labelKey: 'languagesCurrency', icon: Globe, isModalTrigger: true },
    ],
  },
  {
    items: [
      { href: '/help', labelKey: 'helpCenter', icon: HelpCircle },
      { labelKey: 'logOut', icon: LogOut, isAction: true },
    ],
  },
];

interface DesktopNavMenuProps {
  variant?: 'light' | 'dark';
}

export function DesktopNavMenu({ variant = 'light' }: DesktopNavMenuProps) {
  const pathname = usePathname() ?? '/';
  const { locale, setLocale } = useLocale();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const labels = getNamespace(locale, 'nav');
  const clearWishlist = useWishlist((state) => state.clear);
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const activeHref = (() => {
    const items = MENU_GROUPS.flatMap((g) => g.items);
    for (const item of items) {
      if ('href' in item && item.href && pathname.startsWith(item.href)) {
        return item.href;
      }
    }
    return null;
  })();

  const handleSignOut = () => {
    clearWishlist();
    setOpen(false);
  };

  const handleModalTrigger = () => {
    setOpen(false);
    setModalOpen(true);
  };

  const handleLocaleToggle = () => {
    setLocale(locale === 'en' ? 'id' : 'en');
    setOpen(false);
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setOpen(false);
  };

  const handleCurrencySelect = (code: ActiveCurrency) => {
    setCurrency(code);
    setOpen(false);
  };

  return (
    <div className="relative hidden md:block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="desktop-nav-menu"
        aria-label="Open navigation menu"
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          variant === 'dark'
            ? 'border-white/25 text-white hover:bg-white/10'
            : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10',
          open &&
            (variant === 'dark'
              ? 'bg-white/10'
              : 'bg-neutral-100 dark:bg-white/10')
        )}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          id="desktop-nav-menu"
          role="menu"
          aria-label="Primary navigation"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-2 shadow-lg dark:border-white/10 dark:bg-neutral-900"
        >
          {MENU_GROUPS.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {group.items.map((item) => {
                const label = labels[item.labelKey as keyof typeof labels] ?? item.labelKey;
                const isActive = 'href' in item && item.href === activeHref && !('isAction' in item) && !('isModalTrigger' in item) && !('isSettings' in item);

                if ('isAction' in item && item.isAction) {
                  return (
                    <button
                      key={item.labelKey}
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex min-h-[44px] w-full items-center gap-3 px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand dark:text-neutral-300 dark:hover:bg-white/5"
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {label}
                    </button>
                  );
                }

                if ('isModalTrigger' in item && item.isModalTrigger) {
                  return (
                    <button
                      key={item.labelKey}
                      type="button"
                      role="menuitem"
                      onClick={handleModalTrigger}
                      className="flex min-h-[44px] w-full items-center gap-3 px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand dark:text-neutral-300 dark:hover:bg-white/5"
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {label}
                    </button>
                  );
                }

                if ('isSettings' in item && item.isSettings) {
                  return (
                    <div key={item.labelKey} className="px-4 py-2 space-y-1">
                      {/* Language Row */}
                      <button
                        type="button"
                        onClick={handleLocaleToggle}
                        className={cn(
                          'w-full flex min-h-[44px] items-center justify-between px-3 py-2 rounded-lg',
                          'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/10',
                          'transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                          <span className="text-sm font-medium">{locale === 'en' ? 'Language' : 'Bahasa'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold tabular-nums">{locale.toUpperCase()}</span>
                        </div>
                      </button>

                      {/* Currency Row */}
                      <CurrencyRow
                        selectedCurrency={currency}
                        onCurrencyChange={handleCurrencySelect}
                        locale={locale}
                      />

                      {/* Theme Row */}
                      <button
                        type="button"
                        onClick={handleThemeToggle}
                        className={cn(
                          'w-full flex min-h-[44px] items-center justify-between px-3 py-2 rounded-lg',
                          'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/10',
                          'transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {isDark ? (
                            <Sun className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                          ) : (
                            <Moon className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                          )}
                          <span className="text-sm font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold capitalize">{theme}</span>
                        </div>
                      </button>

                      {/* Email Row */}
                      <a
                        href="mailto:hello@baliwild.com"
                        onClick={() => setOpen(false)}
                        className={cn(
                          'w-full flex min-h-[44px] items-center justify-between px-3 py-2 rounded-lg',
                          'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/10',
                          'transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                          <span className="text-sm font-medium">{locale === 'en' ? 'Contact' : 'Kontak'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 truncate">
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">hello@baliwild.com</span>
                        </div>
                      </a>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={label}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex min-h-[44px] items-center gap-3 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
                      isActive
                        ? 'bg-neutral-100 text-brand-ink dark:bg-white/10 dark:text-white'
                        : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/5'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
              {groupIndex < MENU_GROUPS.length - 1 && (
                <div className="my-2 border-t border-neutral-200 dark:border-white/10" />
              )}
            </React.Fragment>
          ))}
        </div>
      ) : null}

      {open && createPortal(
        <div
          id="desktop-nav-menu"
          role="menu"
          aria-label="Primary navigation"
          className={cn('fixed right-4 top-16 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-2 shadow-lg dark:border-white/10 dark:bg-neutral-900', `z-[${Z_INDEX.popover}]`)}
          style={{ right: '1.5rem' }}
        >
          {MENU_GROUPS.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {group.items.map((item) => {
                const label = labels[item.labelKey as keyof typeof labels] ?? item.labelKey;
                const isActive = 'href' in item && item.href === activeHref && !('isAction' in item) && !('isModalTrigger' in item) && !('isSettings' in item);

                if ('isAction' in item && item.isAction) {
                  return (
                    <button
                      key={item.labelKey}
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex min-h-[44px] w-full items-center gap-3 px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand dark:text-neutral-300 dark:hover:bg-white/5"
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {label}
                    </button>
                  );
                }

                if ('isModalTrigger' in item && item.isModalTrigger) {
                  return (
                    <button
                      key={item.labelKey}
                      type="button"
                      role="menuitem"
                      onClick={handleModalTrigger}
                      className="flex min-h-[44px] w-full items-center gap-3 px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand dark:text-neutral-300 dark:hover:bg-white/5"
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {label}
                    </button>
                  );
                }

                if ('isSettings' in item && item.isSettings) {
                  return (
                    <div key={item.labelKey} className="px-4 py-2 space-y-1">
                      {/* Language Row */}
                      <button
                        type="button"
                        onClick={handleLocaleToggle}
                        className={cn(
                          'w-full flex min-h-[44px] items-center justify-between px-3 py-2 rounded-lg',
                          'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/10',
                          'transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                          <span className="text-sm font-medium">{locale === 'en' ? 'Language' : 'Bahasa'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold tabular-nums">{locale.toUpperCase()}</span>
                        </div>
                      </button>

                      {/* Currency Row */}
                      <CurrencyRow
                        selectedCurrency={currency}
                        onCurrencyChange={handleCurrencySelect}
                        locale={locale}
                      />

                      {/* Theme Row */}
                      <button
                        type="button"
                        onClick={handleThemeToggle}
                        className={cn(
                          'w-full flex min-h-[44px] items-center justify-between px-3 py-2 rounded-lg',
                          'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/10',
                          'transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {isDark ? (
                            <Sun className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                          ) : (
                            <Moon className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                          )}
                          <span className="text-sm font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold capitalize">{theme}</span>
                        </div>
                      </button>

                      {/* Email Row */}
                      <a
                        href="mailto:hello@baliwild.com"
                        onClick={() => setOpen(false)}
                        className={cn(
                          'w-full flex min-h-[44px] items-center justify-between px-3 py-2 rounded-lg',
                          'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/10',
                          'transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                          <span className="text-sm font-medium">{locale === 'en' ? 'Contact' : 'Kontak'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 truncate">
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">hello@baliwild.com</span>
                        </div>
                      </a>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={label}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex min-h-[44px] items-center gap-3 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
                      isActive
                        ? 'bg-neutral-100 text-brand-ink dark:bg-white/10 dark:text-white'
                        : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/5'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
              {groupIndex < MENU_GROUPS.length - 1 && (
                <div className="my-2 border-t border-neutral-200 dark:border-white/10" />
              )}
            </React.Fragment>
          ))}
        </div>
      , document.body)}

      <LanguageCurrencyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultLanguage="id-ID"
        defaultCurrency="IDR"
      />
    </div>
  );
}

function CurrencyRow({
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
          'w-full flex min-h-[44px] items-center justify-between px-3 py-2 rounded-lg',
          'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/10',
          'transition-colors'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-3">
          <DollarSign className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {selected?.flag} {selected?.code}
          </span>
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