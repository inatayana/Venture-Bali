import { Star } from 'lucide-react';
import type { VentureReview } from '@/lib/reviewFeed';

interface HomeReviewsSectionProps {
  reviews: VentureReview[];
}

/**
 * Homepage social-proof section: the latest approved guest reviews with the
 * adventure they describe. Real reviews only — never aggregated or invented.
 */
export function HomeReviewsSection({ reviews }: HomeReviewsSectionProps) {
  if (reviews.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-10 md:py-14" aria-labelledby="home-reviews-heading">
      <div className="max-w-[1440px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Real stories from the field</p>
        <h2 id="home-reviews-heading" className="mt-2 font-heading text-2xl md:text-3xl font-bold text-neutral-900">
          Adventures people loved
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {reviews.map(({ review, ventureTitle }) => (
            <figure
              key={review.id}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{ventureTitle}</span>
              <span
                className="mt-2 inline-flex items-center gap-0.5"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${index < Math.round(review.rating) ? 'fill-brand text-brand' : 'text-neutral-300'}`}
                    aria-hidden="true"
                  />
                ))}
              </span>
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-neutral-700">{review.comment}</blockquote>
              <figcaption className="mt-4 text-sm">
                <p className="font-semibold text-neutral-900">{review.author}</p>
                <p className="text-xs text-neutral-500">{review.isVerified ? 'Verified guest' : review.country ?? 'Bali adventure guest'}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
