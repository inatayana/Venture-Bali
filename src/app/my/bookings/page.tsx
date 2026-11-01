import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { verifyCustomerLinkToken } from '@/lib/customerLink';
import { formatPrice } from '@/lib/i18n';
import { LIFECYCLE_LABELS } from '@/lib/bookingLifecycle';
import { canReviewBooking } from '@/lib/reviewSchema';
import { CheckCircle, AlertCircle, Calendar, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My bookings | Venture Bali',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface MyBookingsPageProps {
  searchParams: { token?: string };
}

/**
 * Password-less customer area. The magic link is issued after payment settles,
 * so the guest can always find the voucher without creating an account.
 */
export default async function MyBookingsPage({ searchParams }: MyBookingsPageProps) {
  const payload = verifyCustomerLinkToken(searchParams.token);

  if (!payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
          <h1 className="text-xl font-bold text-neutral-900">This link is invalid or expired</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Open the latest email or WhatsApp message we sent with your booking confirmation. If
            you still cannot find it, reply to that message and our team will resend the voucher.
          </p>
          <Link href="/" className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white">
            Browse adventures
          </Link>
        </div>
      </main>
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: payload.customerId },
    include: {
      bookings: {
        orderBy: { bookingDate: 'desc' },
        include: {
          variant: {
            select: {
              title: true,
              venture: { select: { title: true } },
            },
          },
          slotTime: { select: { time: true } },
          review: { select: { id: true } },
        },
      },
    },
  });

  if (!customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <p className="text-sm text-neutral-600">We could not find this profile.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Hello, {customer.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Your bookings with Venture Bali. This private link expires in 30 days.
        </p>

        {customer.bookings.length === 0 ? (
          <p className="mt-8 rounded-xl bg-white p-6 text-sm text-neutral-500 shadow-sm">
            No bookings yet.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {customer.bookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {booking.variant.venture.title}
                    </p>
                    <p className="text-xs text-neutral-500">{booking.variant.title}</p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                    {LIFECYCLE_LABELS[booking.lifecycleStatus]}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {booking.bookingDate}
                    {booking.slotTime ? ` · ${booking.slotTime.time}` : ''}
                  </span>
                  <span>{booking.paxCount} guests</span>
                  <span className="font-semibold text-neutral-900">
                    {formatPrice(booking.totalPrice)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                  <span className="font-mono text-xs text-neutral-500">{booking.bookingCode}</span>
                  <div className="flex items-center gap-4">
                    {booking.review ? (
                      <span className="text-xs font-medium text-green-700">
                        Review submitted
                      </span>
                    ) : (
                      canReviewBooking({
                        paymentStatus: booking.paymentStatus,
                        bookingDate: booking.bookingDate,
                        reviewId: null,
                      }) && (
                        <Link
                          href={`/review/${booking.id}?token=${searchParams.token ?? ''}`}
                          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-neutral-900"
                        >
                          Write a review <ArrowRight className="h-4 w-4" />
                        </Link>
                      )
                    )}
                    {booking.paymentStatus === 'PAID' ? (
                      <Link
                        href={`/voucher/${booking.id}`}
                        className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-neutral-900"
                      >
                        View voucher <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                        <CheckCircle className="h-4 w-4" /> Awaiting payment
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
