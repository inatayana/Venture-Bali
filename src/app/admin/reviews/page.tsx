import { Star } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ReviewModerationActions } from '@/components/admin/ReviewModerationActions';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const [pending, approved] = await Promise.all([
    prisma.review.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        venture: { select: { title: true } },
        customer: { select: { name: true } },
        booking: { select: { bookingCode: true, bookingDate: true } },
      },
    }),
    prisma.review.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { venture: { select: { title: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pending.length} waiting for moderation · {approved.length} published recently
        </p>
      </header>

      <section className="space-y-3">
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
            Nothing to moderate. Guest reviews appear here after the trip.
          </p>
        ) : (
          pending.map((review) => (
            <article key={review.id} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {review.venture.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {review.guestName?.trim() || review.customer.name}
                    {review.guestLocation?.trim() ? ` · ${review.guestLocation}` : ''} ·{' '}
                    {review.booking?.bookingCode ?? 'manual entry'} ·{' '}
                    {review.booking?.bookingDate ?? review.createdAt.toISOString().slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-0.5" aria-label={`${review.rating} of 5 stars`}>
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-brand text-brand" />
                  ))}
                </div>
              </div>

              <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{review.comment}</p>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400">
                  Submitted {review.createdAt.toISOString().slice(0, 10)}
                  {review.booking ? ' · verified trip' : ''}
                </span>
                <ReviewModerationActions reviewId={review.id} />
              </div>
            </article>
          ))
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Recently published
        </h2>
        <ul className="space-y-2">
          {approved.length === 0 && (
            <li className="text-sm text-gray-500">No published reviews yet.</li>
          )}
          {approved.map((review) => (
            <li key={review.id} className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm">
              <span className="font-semibold text-gray-900">{review.venture.title}</span>
              <span className="ml-2 text-xs text-gray-500">
                {review.rating}★ · {review.comment.slice(0, 80)}
                {review.comment.length > 80 ? '…' : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
