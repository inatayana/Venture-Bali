import { Star, MapPin, Clock, Users, CheckCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import type { VentureItem } from '@/types/venture';
import { CATEGORY_ICONS } from '@/lib/taxonomy';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/lib/i18n';
import { approximateUsd } from '@/lib/fx';

export interface VentureCardProps {
  venture: VentureItem;
  onSelect?: (ventureId: string) => void;
  href?: string;
  className?: string;
}

/**
 * Badge colours for the 9 adventure mega categories.
 * Unknown categories fall back to a neutral style.
 */
const CATEGORY_STYLES: Record<string, string> = {
  ATV: 'bg-orange-100 text-orange-800',
  Rafting: 'bg-cyan-100 text-cyan-800',
  Tubing: 'bg-sky-100 text-sky-800',
  Cycling: 'bg-emerald-100 text-emerald-800',
  Trekking: 'bg-amber-100 text-amber-800',
  'Water Sports': 'bg-blue-100 text-blue-800',
  Snorkeling: 'bg-teal-100 text-teal-800',
  Extreme: 'bg-purple-100 text-purple-800',
  Combo: 'bg-pink-100 text-pink-800',
};

const DEFAULT_CATEGORY_STYLE = 'bg-gray-100 text-gray-800';

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
      <div className="relative h-48 w-full overflow-hidden bg-gray-200">
        <Image
          src={venture.imageUrl}
          alt={venture.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <span
          className={cn(
            'absolute top-3 left-3 px-2.5 py-1 rounded-full font-heading text-xs font-semibold uppercase tracking-wider',
            CATEGORY_STYLES[venture.category] ?? DEFAULT_CATEGORY_STYLE
          )}
        >
          {CATEGORY_ICONS[venture.category] ? (
            <span className="mr-1" aria-hidden="true">
              {CATEGORY_ICONS[venture.category]}
            </span>
          ) : null}
          {venture.category}
        </span>
        {venture.badge && (
          <span className="absolute top-3 right-3 rounded-full bg-brand px-2.5 py-1 font-heading text-xs font-semibold uppercase tracking-wider text-brand-ink">
            {venture.badge}
          </span>
        )}
        {!venture.isAvailable && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full font-heading text-xs font-semibold uppercase tracking-wider bg-red-100 text-red-800">
            Sold Out
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-heading text-lg font-bold text-gray-900 line-clamp-2 mb-2">
          {venture.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            <span className="line-clamp-1">{venture.location}</span>
          </div>
          {venture.bookedThisMonth ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/30 px-2 py-0.5 text-[11px] font-medium text-neutral-800">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              {venture.bookedThisMonth} booked this month
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>{venture.durationHours}h</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" aria-hidden="true" />
            <span>up to {venture.maxParticipants}</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Star
              className="w-4 h-4 fill-brand text-brand"
              aria-hidden="true"
            />
            {venture.reviewCount > 0 ? (
              <>
                <span className="font-medium text-gray-900">{venture.rating.toFixed(1)}</span>
                <span className="text-gray-500">({venture.reviewCount})</span>
              </>
            ) : (
              <span className="text-xs font-medium text-gray-500">New</span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 pt-4 border-t border-gray-100">
          <div className="min-w-0">
            <span className="text-xs text-gray-500 block">From</span>
            <span className="font-heading text-xl font-bold tabular-nums text-brand-ink">
              {formatPrice(venture.priceIdr)}
            </span>
            <span className="ml-1 text-xs text-gray-500">/ guest</span>
            {tierHint && tierHint.minPax > 1 && (
              <span className="ml-1 text-xs text-gray-400">
                · {tierHint.minPax}+ guests
              </span>
            )}
            <span className="mt-0.5 block text-[11px] text-gray-400">
              ≈ {formatPrice(approximateUsd(venture.priceIdr), 'USD')} / person
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            <CheckCircle className="h-3 w-3" aria-hidden="true" />
            Instant Confirmation
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/30 px-2 py-0.5 text-[10px] font-semibold text-neutral-800">
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
          'group bg-white rounded-xl shadow-md overflow-hidden',
          'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
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
        'group bg-white rounded-xl shadow-md overflow-hidden',
        'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
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
