import Link from 'next/link';
import type { Metadata } from 'next';
import { MessageSquareQuote, CalendarDays } from 'lucide-react';
import { AppShellHeader } from '@/components/layout/AppShellHeader';

export const metadata: Metadata = {
  title: 'My Reviews | BaliWild',
  robots: { index: false, follow: false },
};

/**
 * Reviews are attached to bookings, not to a guest account. Rather than show
 * an empty or invented list, this page points guests to the trips where they
 * can leave or read reviews for their own bookings.
 */
export default function MyReviewsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <AppShellHeader title="My reviews" />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10">
            <MessageSquareQuote className="h-7 w-7 text-neutral-400" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold text-neutral-900 dark:text-white">
            Reviews live with your trips
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            After an activity, you can leave a review from the Trip Hub. Open a completed trip to see
            its review link and any review you have already submitted.
          </p>
          <Link
            href="/trips"
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-ink px-6 text-sm font-semibold text-white hover:bg-neutral-900"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Open my trips
          </Link>
        </div>
      </div>
    </main>
  );
}
