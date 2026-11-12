import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Mail, CalendarDays, Compass, ArrowRight } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { BRAND_EMAIL_SUPPORT } from '@/lib/brand';

/**
 * Trips — the guest's trip hub behind the App Shell. BaliWild checkout is
 * password-less: the confirmation email/WhatsApp message carries a private
 * magic link (valid 30 days) that opens /my/bookings. This page explains
 * that flow and keeps old /trips?token= links working by forwarding them.
 */
export const metadata: Metadata = {
  title: 'My trips | BaliWild',
  description: 'Access your BaliWild bookings, vouchers and cancellations.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface TripsPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const { token } = await searchParams;

  // A magic link opened on /trips still reaches the customer area.
  if (token) {
    redirect(`/my/bookings?token=${encodeURIComponent(token)}`);
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-12">
      <header className="bg-brand-ink text-white px-4 py-10">
        <div className="container mx-auto">
          <Link href="/" aria-label="BaliWild home" className="mb-6 inline-block">
            <BrandWordmark className="text-2xl" />
          </Link>
          <h1 className="font-heading text-3xl font-bold">Trips</h1>
          <p className="mt-2 max-w-2xl text-brand/80 text-sm">
            Your bookings, vouchers and cancellations — no password needed.
          </p>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <CalendarDays className="h-6 w-6 text-neutral-700 dark:text-neutral-300" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-heading text-xl font-bold text-neutral-900 dark:text-white">
            Open your private trips link
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
              <span>
                After payment, we send a confirmation email and WhatsApp message
                with your private trips link.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
              <span>
                Open that link to see every booking, download vouchers, reschedule
                or cancel. The link stays valid for 30 days.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Compass className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
              <span>
                Lost the message? Contact{' '}
                <a
                  href={`mailto:${BRAND_EMAIL_SUPPORT}`}
                  className="font-semibold text-brand-ink underline-offset-4 hover:underline"
                >
                  {BRAND_EMAIL_SUPPORT}
                </a>{' '}
                and we will resend it.
              </span>
            </li>
          </ol>
        </div>

        <Link
          href="/explore"
          className="mt-6 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-white transition-colors hover:bg-neutral-900"
        >
          Plan your next adventure
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
