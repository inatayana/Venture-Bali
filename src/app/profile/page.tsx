'use client';

import Link from 'next/link';
import {
  CalendarDays,
  Heart,
  ShieldCheck,
  SlidersHorizontal,
  LifeBuoy,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { BottomSheet } from '@/components/ui';
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { BRAND_EMAIL_SUPPORT } from '@/lib/brand';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { DesktopNavMenu } from '@/components/layout/DesktopNavMenu';

/**
 * Profile — the App Shell's account destination. BaliWild checkout is
 * guest-first (magic link), so this page links to the guest booking lookup
 * and preferences instead of managing a password account.
 */
export default function ProfilePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const links = [
    {
      href: '/trips',
      icon: CalendarDays,
      title: 'My trips',
      description: 'Open the private link from your confirmation email.',
    },
    {
      href: '/wishlists',
      icon: Heart,
      title: 'Wishlists',
      description: 'Adventures you saved for later.',
    },
    {
      href: '/privacy',
      icon: ShieldCheck,
      title: 'Privacy & terms',
      description: 'How BaliWild handles your data.',
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-12">
      <header className="bg-brand-ink text-white px-4 py-10">
        <div className="container mx-auto">
          <div className="mb-6 flex items-start justify-between gap-4">
            <Link href="/" aria-label="BaliWild home" className="inline-block">
              <BrandWordmark className="text-2xl" />
            </Link>
            <DesktopNavMenu variant="dark" />
          </div>
          <h1 className="font-heading text-3xl font-bold">Profile</h1>
          <p className="mt-2 text-brand/80 text-sm">
            Your bookings, saved adventures and preferences — all in one place.
          </p>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:divide-white/10 dark:bg-neutral-900 dark:ring-white/10">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex min-h-[64px] items-center gap-4 px-4 py-3 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-white/5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <link.icon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-base font-bold text-neutral-900 dark:text-white">
                    {link.title}
                  </span>
                  <span className="block truncate text-xs text-neutral-600 dark:text-neutral-400">
                    {link.description}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden="true" />
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex min-h-[64px] w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-white/5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <SlidersHorizontal className="h-5 w-5 text-neutral-700 dark:text-neutral-300" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-base font-bold text-neutral-900 dark:text-white">
                  Preferences
                </span>
                <span className="block text-xs text-neutral-600 dark:text-neutral-400">
                  Language, currency and theme.
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden="true" />
            </button>
          </li>
        </ul>

        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <LifeBuoy className="h-5 w-5 text-neutral-700 dark:text-neutral-300" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-white">
                Need help?
              </h2>
              <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                Our team answers within one business day.
              </p>
              <a
                href={`mailto:${BRAND_EMAIL_SUPPORT}`}
                className="mt-2 inline-flex min-h-[40px] items-center text-sm font-semibold text-brand-ink underline-offset-4 hover:underline"
              >
                {BRAND_EMAIL_SUPPORT}
              </a>
            </div>
          </div>
        </div>
      </div>

      <BottomSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Preferences">
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
            <div className="mt-2">
              <ThemeSwitcher />
            </div>
          </section>
        </div>
      </BottomSheet>
    </main>
  );
}
