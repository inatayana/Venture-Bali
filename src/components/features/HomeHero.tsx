'use client';

import { ArrowRight, Users, CheckCircle, RefreshCw } from 'lucide-react';
import { HeroVideo } from '@/components/features/HeroVideo';
import { useLocale } from '@/components/locale/LocaleProvider';

const TRUST_POINTS = [
  { icon: Users, key: 'trustBeginner' as const },
  { icon: CheckCircle, key: 'trustInstant' as const },
  { icon: RefreshCw, key: 'trustReschedule' as const },
];

/**
 * Home hero: positioning badge, headline + subtitle, one decisive CTA,
 * then three trust promises.
 * Search lives in the header pill and the catalogue filter strip below —
 * never here.
 */
export function HomeHero() {
  const { t } = useLocale();

  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-white">
      <HeroVideo />
      <div aria-hidden="true" className="absolute inset-0 bg-black/10 lg:bg-transparent" />
      {/* Editorial scrim: lighter so background video/image is clearer while keeping text readable. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/5"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-brand-ink/85 via-transparent to-transparent lg:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="container relative mx-auto px-4 pb-6 pt-8 sm:pt-10 lg:pb-10 lg:pt-14">
        <div className="max-w-3xl">
          <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
            {t('heroBadge')}
          </p>

          <h1 className="mt-4 max-w-3xl font-heading text-[clamp(1.75rem,7.5vw,2.25rem)] font-bold leading-[1.06] tracking-tight text-white lg:text-[3.25rem]">
            <span className="block">{t('heroBook')}</span>
            <span className="mt-1.5 block text-brand">{t('heroOwn')}</span>
          </h1>

          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
            {t('heroSub')}
          </p>

          <a
            href="#results"
            className="mt-5 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-brand px-7 text-base font-bold text-brand-ink transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Explore Adventures
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </a>

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
    </section>
  );
}
