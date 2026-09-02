import { Star, MapPin, Clock, Users, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import type { VentureItem } from '@/types/venture';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/lib/i18n';

export interface VentureCardProps {
  venture: VentureItem;
  onSelect?: (ventureId: string) => void;
  className?: string;
}

const categoryStyles: Record<VentureItem['category'], string> = {
  beach: 'bg-cyan-100 text-cyan-800',
  mountain: 'bg-emerald-100 text-emerald-800',
  culture: 'bg-amber-100 text-amber-800',
  adventure: 'bg-orange-100 text-orange-800',
  wellness: 'bg-purple-100 text-purple-800',
};

export function VentureCard({
  venture,
  onSelect,
  className,
}: VentureCardProps) {
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

  return (
    <article
      className={cn(
        'group bg-white rounded-xl shadow-md overflow-hidden',
        'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        onSelect && 'cursor-pointer',
        className
      )}
      onClick={onSelect ? handleClick : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={`View details for ${venture.title}`}
      data-testid={`venture-card-${venture.id}`}
    >
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
            'absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide',
            categoryStyles[venture.category]
          )}
        >
          {venture.category}
        </span>
        {venture.badge && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900">
            {venture.badge}
          </span>
        )}
        {!venture.isAvailable && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            Sold Out
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">
          {venture.title}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          <span className="text-xs text-green-700 font-medium">Instant Confirmation</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            <span className="line-clamp-1">{venture.location}</span>
          </div>
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
              className="w-4 h-4 fill-yellow-400 text-yellow-400"
              aria-hidden="true"
            />
            <span className="font-medium text-gray-900">
              {venture.rating.toFixed(1)}
            </span>
            <span className="text-gray-500">({venture.reviewCount})</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500 block">From</span>
            <span className="text-xl font-bold text-blue-600">
              {formatPrice(venture.priceIdr)}
            </span>
            <span className="text-xs text-gray-500"> / person</span>
          </div>
          {venture.badge && (
            <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full">
              🔥 Trending
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
