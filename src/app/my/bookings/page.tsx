/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createReviewToken, verifyCustomerLinkToken } from '@/lib/customerLink';
import { formatPrice } from '@/lib/i18n';
import { LIFECYCLE_LABELS } from '@/lib/bookingLifecycle';
import { canReviewBooking } from '@/lib/reviewSchema';
import { quoteCancellation } from '@/lib/refundUtils';
import { BookingActions } from '@/components/features/BookingActions';
import { CheckCircle, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';

export const metadata: Metadata = {
  title: 'My bookings | BaliWild',
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
          refund: { select: { status: true, amountIdr: true } },
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
        <div className="mb-6">
          <Link href="/" aria-label="BaliWild home" className="text-brand-ink">
            <BrandWordmark className="text-xl" />
          </Link>
        </div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Hello, {customer.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Your bookings with BaliWild. This private link expires in 30 days.
        </p>

        {customer.bookings.length === 0 ? (
          <p className="mt-8 rounded-xl bg-white p-6 text-sm text-neutral-500 shadow-sm">
            No bookings yet.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {customer.bookings.map((booking) => {
              const quote = quoteCancellation({
                bookingDate: booking.bookingDate,
                slotTime: booking.slotTime?.time,
                totalPrice: booking.totalPrice,
              });
              const actionable =
                booking.paymentStatus === 'PAID' &&
                booking.lifecycleStatus === 'CONFIRMED' &&
                !booking.cancelledAt;
              const reviewable = canReviewBooking({
                paymentStatus: booking.paymentStatus,
                bookingDate: booking.bookingDate,
                reviewId: booking.review?.id ?? null,
                lifecycleStatus: booking.lifecycleStatus,
              });
              const reviewToken = reviewable
                ? createReviewToken(customer.id, booking.id)
                : null;

              return (
              <div key={booking.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {booking.variant.venture.title}
                    </p>
                    <p className="text-xs text-neutral-500">{booking.variant.title}</p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
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
                      reviewable &&
                      reviewToken && (
                        <div className="flex flex-col items-end gap-1">
                          <Link
                            href={`/review/${booking.id}?token=${reviewToken}`}
                            className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-neutral-900"
                          >
                            Write a review <ArrowRight className="h-4 w-4" />
                          </Link>
                          <details className="text-right">
                            <summary className="flex min-h-[44px] cursor-pointer items-center justify-end text-xs font-medium text-neutral-600 underline">
                              Show QR
                            </summary>
                            <img
                              src={`/api/reviews/qr?bookingId=${encodeURIComponent(
                                booking.id
                              )}&token=${encodeURIComponent(reviewToken)}`}
                              alt={`QR code to review ${booking.variant.venture.title}`}
                              width={144}
                              height={144}
                              className="mt-2 h-36 w-36 rounded-lg border border-neutral-200 bg-white p-1"
                            />
                          </details>
                        </div>
                      )
                    )}
                    {booking.paymentStatus === 'PAID' && !booking.cancelledAt ? (
                      <Link
                        href={`/voucher/${booking.id}`}
                        className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-neutral-900"
                      >
                        View voucher <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : booking.refund ? (
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                        Cancelled · refund {booking.refund.status.toLowerCase()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                        <CheckCircle className="h-4 w-4" /> Awaiting payment
                      </span>
                    )}
                  </div>
                </div>

                {booking.refund && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Refund {booking.refund.status.toLowerCase()} ·{' '}
                    {formatPrice(booking.refund.amountIdr)}
                  </p>
                )}

                {actionable && (
                  <BookingActions
                    bookingId={booking.id}
                    token={searchParams.token ?? ''}
                    canCancel={quote.eligible}
                    canReschedule={quote.hoursBefore >= 24}
                    refundAmount={quote.refundAmount}
                    feeAmount={quote.feeAmount}
                  />
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
