'use client';

import { Heart, Star, CheckCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import type { VentureItem } from '@/types/venture';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/lib/i18n';
import { useWishlist, toWishlistDraft } from '@/store/wishlistStore';
import { friendlyBadge } from '@/components/ui/VentureCard';

export interface VentureListCardProps {
  venture: VentureItem;
  href?: string;
  className?: string;
}

/**
 * Vertical-list split card for /explore on mobile (< md).
 * Left ~40%: square photo with badge + transparent wishlist heart.
 * Right ~60%: title, category · hours, rating line, price line, value pill.
 */
export function VentureListCard({ venture, href, className }: VentureListCardProps) {
  const wishlisted = useWishlist((state) => state.items.some((item) => item.id === venture.id));
  const toggleWishlist = useWishlist((state) => state.toggle);

  const destination = href ?? `/experiences/${venture.id}/${venture.slug}`;
  const hasPromo = venture.promoPriceIdr !== null;
  const valueTag = hasPromo ? 'Promo price' : 'Instant Confirmation';
  const ValueIcon = hasPromo ? RefreshCw : CheckCircle;

  const handleWishlist = () => {
    toggleWishlist(toWishlistDraft(venture));
  };

  return (
    <article className={cn('flex flex-row items-start gap-3.5', className)}>
      {/* Image — 1:1 square, frameless (spec) */}
      <div className="relative w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] shrink-0 rounded-2xl overflow-hidden">
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
              sizes="120px"
              className="object-cover"
            />
            {!venture.isAvailable ? (
              <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-red-600 shadow-sm backdrop-blur">
                Sold Out
              </span>
            ) : venture.badge ? (
              <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-sm backdrop-blur">
                {friendlyBadge(venture.badge)}
              </span>
            ) : null}
          </div>
        </a>
        <button
          type="button"
          onClick={handleWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? `Remove ${venture.title} from wishlists` : `Save ${venture.title} to wishlists`}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-black/20 text-white backdrop-blur-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Heart
            className={cn('h-4 w-4', wishlisted ? 'fill-red-400 text-red-400' : 'text-white')}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Content — flex column (spec) */}
      <a href={destination} className="flex flex-col flex-1 min-w-0 gap-4 py-1">
        {/* Row 1 — title */}
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-900 dark:text-white">
          {venture.title}
        </h3>

        {/* Row 2 — category & duration */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {venture.category} · {venture.durationHours} hours
        </p>

        {/* Row 3 — rating */}
        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 mt-0.5 flex items-center gap-1">
          <Star className="h-3 w-3 fill-brand text-brand-ink dark:text-brand" aria-hidden="true" />
          {venture.reviewCount > 0 ? (
            <>
              <span>{venture.rating.toFixed(1)}</span>
              <span aria-hidden="true">·</span>
              <span>{venture.reviewCount} reviews</span>
            </>
          ) : (
            <span>★ New</span>
          )}
        </p>

        {/* Row 4 — price */}
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
          From{' '}
          {hasPromo && (
            <span className="mr-1 tabular-nums text-neutral-400 line-through">
              {formatPrice(venture.listPriceIdr)}
            </span>
          )}
          <span className="font-semibold tabular-nums text-neutral-900 dark:text-white">
            {formatPrice(venture.priceIdr)}
          </span>
          <span> / guest</span>
        </p>

        {/* Row 5 — value pill */}
        <span className="inline-block w-fit mt-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          <ValueIcon className="h-3 w-3 inline-block mr-1" aria-hidden="true" />
          {valueTag}
        </span>
      </a>
    </article>
  );
}
