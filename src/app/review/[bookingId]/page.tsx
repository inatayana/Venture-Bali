import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyCustomerLinkToken } from '@/lib/customerLink';
import { canReviewBooking, reviewBlockedReason } from '@/lib/reviewSchema';
import { ReviewForm } from '@/components/features/ReviewForm';

export const dynamic = 'force-dynamic';

interface ReviewPageProps {
  params: { bookingId: string };
  searchParams: { token?: string };
}

export default async function ReviewPage({ params, searchParams }: ReviewPageProps) {
  const session = verifyCustomerLinkToken(searchParams.token);
  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
          <h1 className="font-heading text-lg font-bold text-neutral-900">Link expired</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Open the review link from your booking confirmation message, or reply to it and our team
            will resend it.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-brand-ink px-5 text-sm font-semibold text-brand"
          >
            Back to adventures
          </Link>
        </div>
      </main>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: {
      id: true,
      customerId: true,
      paymentStatus: true,
      bookingDate: true,
      review: { select: { id: true } },
      variant: { select: { title: true, venture: { select: { title: true } } } },
    },
  });

  if (!booking || booking.customerId !== session.customerId) notFound();

  const reviewable = {
    paymentStatus: booking.paymentStatus,
    bookingDate: booking.bookingDate,
    reviewId: booking.review?.id ?? null,
  };
  const blocked = reviewBlockedReason(reviewable);
  const ventureTitle = booking.variant?.venture.title ?? 'Your adventure';

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link href={`/my/bookings?token=${searchParams.token ?? ''}`} className="text-sm text-neutral-600 hover:text-neutral-900">
          ← My bookings
        </Link>

        <h1 className="mt-4 font-heading text-2xl font-bold text-neutral-900">Review your trip</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {booking.bookingDate} · {booking.variant?.title ?? 'Adventure'}
        </p>

        <div className="mt-6">
          {blocked || !canReviewBooking(reviewable) ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <p className="text-sm text-neutral-700">{blocked ?? 'This trip cannot be reviewed.'}</p>
              <Link
                href={`/my/bookings?token=${searchParams.token ?? ''}`}
                className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-neutral-900 underline"
              >
                Back to my bookings
              </Link>
            </div>
          ) : (
            <ReviewForm
              bookingId={booking.id}
              token={searchParams.token ?? ''}
              ventureTitle={ventureTitle}
            />
          )}
        </div>
      </div>
    </main>
  );
}
