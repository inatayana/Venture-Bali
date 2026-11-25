import Link from 'next/link';
import type { Metadata } from 'next';
import { Bell, CalendarDays, MessageCircle } from 'lucide-react';
import { AppShellHeader } from '@/components/layout/AppShellHeader';
import { GlobalDesktopHeader } from '@/components/layout/GlobalDesktopHeader';
import { DesktopBreadcrumb } from '@/components/layout/DesktopBreadcrumb';

export const metadata: Metadata = {
  title: 'Notifications | BaliWild',
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <GlobalDesktopHeader />
      <DesktopBreadcrumb label="Notifications" />
      <AppShellHeader title="Notifications" mobileOnly />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10">
            <Bell className="h-7 w-7 text-neutral-400" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold text-neutral-900 dark:text-white">
            No new notifications
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Trip reminders, payment confirmations and review requests are sent by email and WhatsApp.
            Your upcoming activities are always listed in Trips.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/trips"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-white hover:bg-neutral-900"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              My trips
            </Link>
            <Link
              href="/messages"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-200 px-5 text-sm font-semibold text-neutral-800 hover:border-brand dark:border-white/10 dark:text-white"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Message us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
