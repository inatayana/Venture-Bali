'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VentureCard } from '@/components/ui';
import { isSlotBookable } from '@/lib/pricing';
import { cn } from '@/utils/cn';
import type { VentureItem } from '@/types/venture';

/** Card width per breakpoint: mobile peek (~2 full + 1 peek) up to 6-up on xl. */
const CARD_WIDTH =
  'w-[44vw] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-4rem)/5)] xl:w-[calc((100%-5rem)/6)]';

const scrollbarHidden =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

interface CuratedRow {
  /** Stable id used for aria labelling and keys. */
  id: string;
  title: string;
  items: VentureItem[];
}

interface CuratedRowProps {
  row: CuratedRow;
}

function Row({ row }: CuratedRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [row.items.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <section aria-label={row.title} className="mb-8 last:mb-0">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="font-heading text-xl font-bold text-neutral-900 dark:text-white">
          {row.title}
        </h2>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
            aria-label={`Scroll ${row.title} back`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            aria-label={`Scroll ${row.title} forward`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className={cn(
          'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2',
          scrollbarHidden
        )}
      >
        {row.items.map((venture) => (
          <div key={venture.id} className={cn('shrink-0 snap-start', CARD_WIDTH)}>
            <VentureCard venture={venture} href={`/experiences/${venture.id}/${venture.slug}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

const MAX_ROW_ITEMS = 12;
const MIN_ROW_ITEMS = 4;

function pickRows(ventures: VentureItem[]): CuratedRow[] {
  const byRating = [...ventures].sort((a, b) => b.rating - a.rating);
  const byPopularity = [...ventures].sort(
    (a, b) =>
      (b.bookedThisMonth ?? 0) - (a.bookedThisMonth ?? 0) ||
      b.rating - a.rating ||
      b.reviewCount - a.reviewCount
  );

  // Row 1 — Most Booked in Bali: the crowd favourites, all levels.
  const mostBooked = byPopularity.slice(0, MAX_ROW_ITEMS);

  // Row 2 — Today's departures that can actually be booked right now.
  const todayKey = (() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  })();
  const bookToday = byRating
    .filter((venture) =>
      (venture.variants ?? []).some(
        (variant) =>
          variant.slotTimes?.some(
            (slot) =>
              slot.isAvailable &&
              isSlotBookable(todayKey, slot.time, variant.fulfillmentMode, new Date(), slot.cutoffHours)
          )
      )
    )
    .slice(0, MAX_ROW_ITEMS);

  // Row 3 — BaliWild Signature Day Trips: full-day escapes (6h+), any category.
  // NOTE: the pre-launch catalogue ships with only short half-day products, so
  // this row stays hidden until full-day/combo packages are seeded (or the
  // threshold is relaxed). Never ship placeholder products to make it appear.
  const signature = byRating
    .filter((venture) => venture.durationHours >= 6)
    .slice(0, MAX_ROW_ITEMS);

  // Row 4 — Easy Half-Day Escapes: gentle, flexible, under 4 hours.
  const halfDays = byRating
    .filter((venture) => venture.durationHours <= 4)
    .slice(0, MAX_ROW_ITEMS);

  const rows: CuratedRow[] = [
    { id: 'most-booked', title: 'Most Booked in Bali', items: mostBooked },
  ];

  if (bookToday.length >= MIN_ROW_ITEMS) {
    rows.push({ id: 'today', title: 'Book Today, Go Today', items: bookToday });
  }

  if (signature.length >= MIN_ROW_ITEMS) {
    rows.push({ id: 'signature-day-trips', title: 'BaliWild Signature Day Trips', items: signature });
  }

  if (halfDays.length >= MIN_ROW_ITEMS) {
    rows.push({ id: 'half-days', title: 'Easy Half-Day Escapes · Under 4 Hours', items: halfDays });
  }

  return rows;
}

/**
 * Curated horizontal rows for the default Explore view (Airbnb-style).
 * Renders instead of the flat grid when no filter/search is active.
 * Cards are snap-aligned; mobile shows ~2 full cards + a peeking third.
 */
export function CuratedRows({ ventures }: { ventures: VentureItem[] }) {
  const rows = useMemo(() => pickRows(ventures), [ventures]);

  return (
    <div>
      {rows.map((row) => (
        <Row key={row.id} row={row} />
      ))}
    </div>
  );
}
