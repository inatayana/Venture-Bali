'use client';

import { HeroVideo } from '@/components/features/HeroVideo';
import { HeroSearch, type HeroSuggestion } from '@/components/search/HeroSearch';
import { RotatingKeyword } from '@/components/features/RotatingKeyword';
import { useLocale } from '@/components/locale/LocaleProvider';

interface HomeHeroProps {
  hubs: readonly string[];
  suggestions: readonly HeroSuggestion[];
}

/**
 * Home hero section with exact specifications:
 * - Height: 600px (Desktop) / 80vh (Tablet) / 450px (Mobile)
 * - Width: 100vw / 100% (Full-width)
 * - Background: cover, center
 * - Flexbox column, justify-center, items-center
 * - Search bar floating: max-width 760px, height 64px, border-radius 999px (pill), centered at middle
 */
export function HomeHero({ hubs, suggestions }: HomeHeroProps) {
  const { t } = useLocale();

  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-white">
      {/* Background video with poster fallback */}
      <div className="absolute inset-0 z-0">
        <HeroVideo />
      </div>

      {/* Gradient overlays for text readability */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-brand-ink via-transparent to-black/25 lg:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-brand/10 blur-3xl"
      />

      {/* Main hero container - full width, fixed height */}
      <div className="relative w-full">
        <div className="relative flex h-[450px] max-h-[450px] md:h-[80vh] md:max-h-[600px] lg:h-[600px] lg:max-h-[600px] flex-col items-center justify-center px-4 sm:px-6 py-10 lg:py-16">
          {/* Top Content Group: Badge + Headline + Subtitle */}
          <div className="flex flex-col items-center text-center w-full max-w-3xl">
            {/* Badge */}
            <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
              {t('heroBadge') ?? 'OTA Petualangan & Aktivitas Outdoor #1 di Bali'}
            </p>

            {/* Headline */}
            <h1 className="mt-5 max-w-3xl font-heading text-[clamp(1.75rem,7.5vw,2.25rem)] font-bold uppercase leading-[1.06] tracking-tight text-white lg:text-[3.25rem]">
              <span className="block">
                {t('heroBook')} <RotatingKeyword />
              </span>
              <span className="mt-2 block">{t('heroOwn')}</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base lg:text-lg">
              {t('heroSub') ?? 'Rafting, ATV, tubing & trekking di seluruh Bali. Konfirmasi instan, reschedule gratis, dan 100% dijalankan operator lokal.'}
            </p>
          </div>

          {/* Middle: Floating Search Bar - Pill shape, max-width 760px, height 64px */}
          <div className="my-10 lg:my-14 w-full max-w-[760px] mx-auto flex-shrink-0">
            <HeroSearch hubs={hubs} suggestions={suggestions} />
          </div>

          {/* Bottom Content Group: Trust points */}
          <div className="flex flex-col items-center text-center w-full">
            {/* Trust points */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-medium text-white/80 sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 11a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xs font-medium text-white/80 sm:text-sm">{t('trustInstant')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span className="text-xs font-medium text-white/80 sm:text-sm">{t('trustReschedule')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span className="text-xs font-medium text-white/80 sm:text-sm">{t('trustRefund')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}