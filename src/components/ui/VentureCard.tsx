'use client';

import { Star, Clock, Users, CheckCircle, RefreshCw, Heart } from 'lucide-react';
import Image from 'next/image';
import type { VentureItem } from '@/types/venture';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/lib/i18n';
import { PriceApprox } from '@/components/currency/PriceApprox';
import { useWishlist, toWishlistDraft } from '@/store/wishlistStore';

export interface VentureCardProps {
  venture: VentureItem;
  onSelect?: (ventureId: string) => void;
  href?: string;
  className?: string;
}

/** Cheapest tier across the package list — used for the "N+ guests" price hint. */
function cheapestTier(venture: VentureItem) {
  return (venture.variants ?? [])
    .flatMap((variant) => variant.priceTiers)
    .reduce<{ minPax: number; pricePerPax: number } | null>(
      (best, tier) => (!best || tier.pricePerPax < best.pricePerPax ? tier : best),
      null
    );
}

export function VentureCard({
  venture,
  onSelect,
  href,
  className,
}: VentureCardProps) {
  const tierHint = cheapestTier(venture);
  const wishlisted = useWishlist((state) => state.items.some((item) => item.id === venture.id));
  const toggleWishlist = useWishlist((state) => state.toggle);

  const handleWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleWishlist(toWishlistDraft(venture));
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(venture.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(venture.id);
    }
  };

  const content = (
    <>
      <div className="relative aspect-square w-full overflow-hidden bg-gray-200">
        <Image
          src={venture.imageUrl}
          alt={venture.title}
          fill
          sizes="(max-width: 768px) 44vw, (max-width: 1024px) 30vw, (max-width: 1536px) 20vw, 16vw"
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {!venture.isAvailable ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-red-600 shadow-sm backdrop-blur sm:left-3 sm:top-3 sm:px-2.5 sm:py-1">
            Sold Out
          </span>
        ) : venture.badge ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-800 shadow-sm backdrop-blur sm:left-3 sm:top-3 sm:px-2.5 sm:py-1">
            {venture.badge}
          </span>
        ) : null}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? `Remove ${venture.title} from wishlists` : `Save ${venture.title} to wishlists`}
          aria-pressed={wishlisted}
          className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:right-3 sm:top-3"
        >
          <Heart
            className={cn('h-4.5 w-4.5', wishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-700')}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="p-4 sm:p-5">
        {/* Line 1 — title */}
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
          {venture.title}
        </h3>

        {/* Line 2 — category & duration */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-1">
            {venture.category} · {venture.durationHours}h
          </span>
        </div>

        <div className="mt-2 hidden items-center gap-3 text-xs text-gray-600 sm:flex">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            up to {venture.maxParticipants}
          </span>
          {venture.bookedThisMonth ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/30 px-2 py-0.5 font-medium text-neutral-800">
              <Users className="h-3 w-3" aria-hidden="true" />
              {venture.bookedThisMonth} booked this month
            </span>
          ) : null}
        </div>

        {/* Line 3 — anchoring price + net price + rating */}
        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-gray-100 pt-2.5 sm:mt-3 sm:pt-3">
          <span className="text-xs font-medium text-gray-500">From</span>
          {venture.promoPriceIdr !== null && (
            <span className="text-sm tabular-nums text-red-500 line-through">
              {formatPrice(venture.listPriceIdr)}
            </span>
          )}
          <span className="font-heading text-base font-bold tabular-nums text-brand-ink sm:text-lg">
            {formatPrice(venture.priceIdr)}
          </span>
          <span className="text-xs text-gray-500">/ guest</span>
          {tierHint && tierHint.minPax > 1 && (
            <span className="text-xs text-gray-500">· {tierHint.minPax}+ guests</span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-brand text-brand" aria-hidden="true" />
            {venture.reviewCount > 0 ? (
              <>
                <span className="text-xs font-medium text-gray-900">{venture.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({venture.reviewCount})</span>
              </>
            ) : (
              <span className="text-xs font-medium text-gray-500">New</span>
            )}
          </span>
        </div>
        <PriceApprox amountIdr={venture.priceIdr} suffix=" / person" className="mt-0.5 block" />

        {/* Line 4 — operational value tags */}
        <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" aria-hidden="true" />
            Instant Confirmation
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Free reschedule ≥24h
          </span>
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <article
        className={cn(
          'group overflow-hidden rounded-2xl bg-white shadow-md',
          'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
          className,
        )}
        aria-label={`View details for ${venture.title}`}
        data-testid={`venture-card-${venture.id}`}
      >
        <a href={href} className="block">
          {content}
        </a>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-2xl bg-white shadow-md',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        onSelect && 'cursor-pointer',
        className,
      )}
      onClick={onSelect ? handleClick : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={`View details for ${venture.title}`}
      data-testid={`venture-card-${venture.id}`}
    >
      {content}
    </article>
  );
}
