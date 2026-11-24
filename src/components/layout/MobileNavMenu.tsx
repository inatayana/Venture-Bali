'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { BottomSheet } from '@/components/ui';
import { CATEGORY_REGISTRY } from '@/lib/taxonomy';
import { BRAND_EMAIL_HELLO } from '@/lib/brand';
import { useLocale } from '@/components/locale/LocaleProvider';

/**
 * Mobile-only burger menu.
 *
 * One 44px trigger in the header opens a bottom sheet with a structured
 * navigation: primary links first (Home, Adventures, My Bookings, Contact),
 * then the nine adventure mega categories (AGENTS.md §9 — no other links).
 * Language, currency and theme stay in the sibling HeaderSettings sheet so
 * each sheet has a single, clear purpose.
 */
export function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  const primaryLinks = [
    { href: '/', label: t('nav', 'home') },
    { href: '/experiences', label: t('nav', 'adventures') },
    { href: '/my/bookings', label: t('nav', 'myBookings') },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Menu">
        <nav aria-label="Mobile">
          <ul className="space-y-1">
            {primaryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[48px] items-center rounded-xl px-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-white dark:hover:bg-white/10"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${BRAND_EMAIL_HELLO}`}
                onClick={() => setOpen(false)}
                className="flex min-h-[48px] items-center rounded-xl px-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-white dark:hover:bg-white/10"
              >
                {t('nav', 'contact')}
              </a>
            </li>
          </ul>

          <div className="my-3 h-px bg-neutral-200 dark:bg-white/10" />

          <p className="px-3 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500 dark:text-white/50">
            {t('nav', 'categories')}
          </p>
          <ul className="mt-1 grid grid-cols-2 gap-x-2">
            {CATEGORY_REGISTRY.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/?category=${category.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] max-w-full items-center gap-1.5 rounded-lg px-3 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-brand-ink dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-brand"
                >
                  <span className="w-5 shrink-0 text-center" aria-hidden="true">
                    {category.emoji}
                  </span>
                  <span className="truncate">{category.short}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </BottomSheet>
    </>
  );
}
