'use client';

import Link from 'next/link';
import { CheckCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { HeroSearch, type HeroSuggestion } from '@/components/search/HeroSearch';
import { RotatingKeyword } from '@/components/features/RotatingKeyword';
import { HeroGallery } from '@/components/features/HeroGallery';
import { useLocale } from '@/components/locale/LocaleProvider';

const TRUST_POINTS = [
  { icon: CheckCircle, key: 'trustInstant' as const },
  { icon: RefreshCw, key: 'trustReschedule' as const },
  { icon: ShieldCheck, key: 'trustRefund' as const },
];

const INTENT_PILLS = [
  { href: '/?sort=popular', key: 'heroBest' as const, emoji: '⚡' },
  { href: '/?category=water-sports', key: 'heroWater' as const, emoji: '🌊' },
  { href: '/?category=trekking', key: 'heroTrekking' as const, emoji: '🏔️' },
  { href: '/?category=combo', key: 'heroCombos' as const, emoji: '🔥' },
  { href: '/?category=tubing', key: 'heroTubing' as const, emoji: '🛶' },
];

interface HomeHeroProps {
  hubs: readonly string[];
  suggestions: readonly HeroSuggestion[];
  /** Gallery images from ventures to display in the hero carousel */
  galleryImages?: readonly string[];
}

/**
 * Home hero: split layout on desktop (copy left, gallery right), stacked on mobile.
 * Shows an interactive gallery carousel of adventure images alongside the headline,
 * search, and trust promises.
 */
export function HomeHero({ hubs, suggestions, galleryImages = [] }: HomeHeroProps) {
  const { t } = useLocale();

  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-white">
      {/* Background gradient layers */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/5 lg:from-black/80 lg:via-black/40 lg:to-transparent" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brand-ink via-transparent to-black/25 lg:hidden" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />

      <div className="container relative mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Desktop: side-by-side layout */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          {/* Copy column */}
          <div className="lg:col-span-6 lg:pr-8">
            <div className="max-w-xl">
              <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                {t('heroBadge')}
              </p>

              <h1 className="mt-4 max-w-3xl font-heading text-[clamp(1.75rem,7.5vw,2.25rem)] font-bold uppercase leading-[1.06] tracking-tight text-white lg:text-[3.25rem]">
                <span className="block">
                  {t('heroBook')} <RotatingKeyword />
                </span>
                <span className="mt-1.5 block">{t('heroOwn')}</span>
              </h1>

              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
                {t('heroSub')}
              </p>

              <div className="mt-5">
                <HeroSearch hubs={hubs} suggestions={suggestions} />
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                {INTENT_PILLS.map((pill) => (
                  <Link
                    key={pill.href}
                    href={pill.href}
                    className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-white/20 bg-white/5 px-3 text-xs font-semibold text-white/80 backdrop-blur-[1px] transition-colors hover:border-brand hover:bg-brand/10 hover:text-brand"
                  >
                    {pill.emoji} {t(pill.key)}
                  </Link>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-white/80">
                {TRUST_POINTS.map(({ icon: Icon, key }) => (
                  <span key={key} className="inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                    {t(key)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Gallery column */}
          <div className="lg:col-span-6">
            {galleryImages.length > 0 && (
              <HeroGallery
                images={galleryImages}
                autoPlayInterval={5000}
                showArrows={true}
                showIndicators={true}
                altPrefix="Bali adventure"
                className="h-[500px] max-h-[60vh]"
              />
            )}
          </div>
        </div>

        {/* Mobile: stacked layout (gallery above copy) */}
        <div className="lg:hidden space-y-8">
          {galleryImages.length > 0 && (
            <HeroGallery
              images={galleryImages}
              autoPlayInterval={5000}
              showArrows={true}
              showIndicators={true}
              altPrefix="Bali adventure"
              className="h-[300px] max-h-[40vh] rounded-xl"
            />
          )}
          <div className="max-w-xl">
            <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
              {t('heroBadge')}
            </p>

            <h1 className="mt-4 max-w-3xl font-heading text-[clamp(1.75rem,7.5vw,2.25rem)] font-bold uppercase leading-[1.06] tracking-tight text-white">
              <span className="block">
                {t('heroBook')} <RotatingKeyword />
              </span>
              <span className="mt-1.5 block">{t('heroOwn')}</span>
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
              {t('heroSub')}
            </p>

            <div className="mt-5">
              <HeroSearch hubs={hubs} suggestions={suggestions} />
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              {INTENT_PILLS.map((pill) => (
                <Link
                  key={pill.href}
                  href={pill.href}
                  className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-white/20 bg-white/5 px-3 text-xs font-semibold text-white/80 backdrop-blur-[1px] transition-colors hover:border-brand hover:bg-brand/10 hover:text-brand"
                >
                  {pill.emoji} {t(pill.key)}
                </Link>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-white/80">
              {TRUST_POINTS.map(({ icon: Icon, key }) => (
                <span key={key} className="inline-flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                  {t(key)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
