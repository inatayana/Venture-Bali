'use client';

import { Heart, Star, CheckCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import type { VentureItem } from '@/types/venture';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/lib/i18n';
import { useWishlist, toWishlistDraft } from '@/store/wishlistStore';

export interface VentureListCardProps {
  venture: VentureItem;
  href?: string;
  className?: string;
}

/**
 * State 4 — horizontal split card for the mobile filtered list view.
 * 40% square image (badge + wishlist heart) on the left,
 * 60% stacked content on the right.
 */
export function VentureListCard({ venture, href, className }: VentureListCardProps) {
  const wishlisted = useWishlist((state) => state.items.some((item) => item.id === venture.id));
  const toggleWishlist = useWishlist((state) => state.toggle);

  const destination = href ?? `/experiences/${venture.id}/${venture.slug}`;
  const hasPromo = venture.promoPriceIdr !== null;
  const valueTag = hasPromo ? 'Book early to save' : 'Instant Confirmation';
  const ValueIcon = hasPromo ? RefreshCw : CheckCircle;

  const handleWishlist = () => {
    toggleWishlist(toWishlistDraft(venture));
  };

  return (
    <article
      className={cn(
        'flex gap-3 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-neutral-100 transition-shadow hover:shadow-md dark:bg-neutral-900 dark:ring-white/10',
        className
      )}
    >
      {/* Image — 40% */}
      <div className="relative w-[40%] max-w-[180px] shrink-0">
        <a
          href={destination}
          aria-label={`View details for ${venture.title}`}
          className="block overflow-hidden rounded-2xl bg-gray-200"
        >
          <div className="relative aspect-square w-full">
            <Image
              src={venture.imageUrl}
              alt={venture.title}
              fill
              sizes="40vw"
              className="object-cover"
            />
            {!venture.isAvailable ? (
              <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-600 shadow-sm backdrop-blur">
                Sold Out
              </span>
            ) : venture.badge ? (
              <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-800 shadow-sm backdrop-blur">
                {venture.badge}
              </span>
            ) : null}
          </div>
        </a>
        <button
          type="button"
          onClick={handleWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? `Remove ${venture.title} from wishlists` : `Save ${venture.title} to wishlists`}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Heart
            className={cn('h-4 w-4', wishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-700')}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Content — 60% */}
      <a href={destination} className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-1">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-gray-900 dark:text-white">
          {venture.title}
        </h3>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
          {venture.category} · {venture.durationHours} hours
        </p>
        <p className="flex items-center gap-1 text-[11px] text-neutral-700 dark:text-neutral-300">
          <Star className="h-3 w-3 fill-brand text-brand" aria-hidden="true" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            {venture.rating.toFixed(1)}
          </span>
          <span className="text-neutral-500 dark:text-neutral-400">
            ({venture.reviewCount} reviews)
          </span>
        </p>

        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-[10px] font-medium text-neutral-500">From</span>
          {hasPromo && (
            <span className="text-[11px] tabular-nums text-red-500 line-through">
              {formatPrice(venture.listPriceIdr)}
            </span>
          )}
          <span className="text-[13px] font-bold tabular-nums text-brand-ink dark:text-white">
            {formatPrice(venture.priceIdr)}
          </span>
          <span className="text-[10px] text-neutral-500">/ guest</span>
        </p>

        <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          <ValueIcon className="h-3 w-3" aria-hidden="true" />
          {valueTag}
        </span>
      </a>
    </article>
  );
}
