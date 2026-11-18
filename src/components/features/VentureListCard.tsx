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
    <article
      className={cn(
        'flex gap-3 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-neutral-100 transition-shadow hover:shadow-md dark:bg-neutral-900 dark:ring-white/10',
        className
      )}
    >
      {/* Image — ~40% */}
      <div className="relative w-[40%] max-w-[160px] shrink-0">
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

      {/* Content — ~60% */}
      <a href={destination} className="flex min-w-0 flex-1 flex-col justify-center py-1">
        {/* Row 1 — title */}
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
          {venture.title}
        </h3>

        {/* Row 2 — category & duration */}
        <p className="mt-0.5 text-xs text-muted-foreground dark:text-neutral-400">
          {venture.category} · {venture.durationHours} hours
        </p>

        {/* Row 3 — rating & reviews */}
        <p className="mt-1 flex items-center gap-1 text-xs text-foreground/90 dark:text-neutral-200">
          <Star className="h-3 w-3 fill-brand text-brand-ink dark:text-brand" aria-hidden="true" />
          <span className="font-semibold">{venture.rating.toFixed(1)}</span>
          <span aria-hidden="true">·</span>
          <span>{venture.reviewCount} reviews</span>
        </p>

        {/* Row 4 — price */}
        <p className="mt-1.5 text-xs leading-relaxed">
          From{' '}
          {hasPromo && (
            <span className="mr-1 tabular-nums text-muted-foreground line-through dark:text-neutral-400">
              {formatPrice(venture.listPriceIdr)}
            </span>
          )}
          <span className="font-semibold tabular-nums text-foreground dark:text-white">
            {formatPrice(venture.priceIdr)}
          </span>
          <span className="text-muted-foreground dark:text-neutral-400"> / guest</span>
        </p>

        {/* Row 5 — value pill (optional) */}
        <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          <ValueIcon className="h-3 w-3" aria-hidden="true" />
          {valueTag}
        </span>
      </a>
    </article>
  );
}
