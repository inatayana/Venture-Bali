import { CheckCircle, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
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
}

/**
 * Home hero: dark band with the brand accent and the unified search control
 * (destination, date, guests) so the catalogue starts above the fold.
 */
export function HomeHero({ hubs, suggestions }: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden bg-brand-ink text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="container relative mx-auto px-4 py-10 sm:py-16">
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

        <ul className="mt-6 flex flex-wrap gap-2 text-xs">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-white/85"
            >
              <Icon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>

        <p className="mt-6 hidden items-center gap-1.5 text-[11px] text-white/50 sm:inline-flex">
          <CheckCircle className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
          Prices in IDR · USD shown for reference
        </p>
      </div>
    </section>
  );
}
