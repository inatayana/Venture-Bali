import { CheckCircle, ShieldCheck, Sparkles, Star, Wallet } from 'lucide-react';
import { HeroSearch, type HeroSuggestion } from '@/components/search/HeroSearch';
import { RotatingKeyword } from '@/components/features/RotatingKeyword';

const TRUST_POINTS = [
  { icon: Sparkles, label: 'Instant confirmation' },
  { icon: ShieldCheck, label: '80% refund ≥24h' },
  { icon: Wallet, label: 'Secure checkout · VISA / QRIS' },
];

interface HomeHeroProps {
  hubs: readonly string[];
  suggestions: readonly HeroSuggestion[];
  stats: {
    categories: number;
    /** Average rating across products that have reviews, or null. */
    avgRating: number | null;
    reviewCount: number;
  };
}

/**
 * Home hero: dark band with the brand accent and the unified search control
 * (destination, date, guests) so the catalogue starts above the fold.
 */
export function HomeHero({ hubs, suggestions, stats }: HomeHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-white">
      {/* Cinematic layer: drop /public/images/hero-bali.jpg to activate it; the
          scrim keeps headline contrast either way. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/images/hero-bali.jpg')] bg-cover bg-center opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/65 to-black"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="container relative mx-auto px-4 pb-0 pt-10 sm:pt-16">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
          Bali · 9 adventure categories
        </p>

        <h2 className="mt-4 max-w-3xl font-heading text-[clamp(1.15rem,6.2vw,3rem)] font-bold uppercase leading-[1.08] tracking-tight text-white">
          <span className="block whitespace-nowrap">
            Book the <RotatingKeyword />
          </span>
          <span className="mt-1 block">Own the wild!</span>
        </h2>

        <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
          Rafting, ATV, tubing and trekking across Bali — instant confirmation,
          free reschedule up to 24 hours before, run by licensed local operators.
        </p>

        <HeroSearch hubs={hubs} suggestions={suggestions} />

        <p className="mt-4 hidden items-center gap-1.5 text-[11px] text-white/50 sm:inline-flex">
          <CheckCircle className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
          Prices in IDR · USD shown for reference
        </p>
      </div>

      {/* Bottom trust / social proof bar */}
      <div className="relative mt-8 border-t border-white/10">
        <div className="container mx-auto flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-[11px] text-white/70">
          {stats.avgRating !== null ? (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-brand text-brand" aria-hidden="true" />
              <strong className="font-semibold text-white">{stats.avgRating.toFixed(1)}</strong>
              · {stats.reviewCount} verified review{stats.reviewCount === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              {stats.categories} adventure categories in Bali
            </span>
          )}

          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
