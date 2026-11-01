'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle, Flame, ShieldCheck, Sparkles, Star, Wallet } from 'lucide-react';
import { HeroSearch, type HeroSuggestion } from '@/components/search/HeroSearch';
import { RotatingKeyword } from '@/components/features/RotatingKeyword';
import { useLocale } from '@/components/locale/LocaleProvider';

const TRUST_POINTS = [
  { icon: Sparkles, key: 'trustInstant' as const },
  { icon: ShieldCheck, key: 'trustRefund' as const },
  { icon: Wallet, key: 'trustSecure' as const },
];

const INTENT_PILLS = [
  { href: '/?sort=popular', key: 'heroBest' as const, emoji: '⚡' },
  { href: '/?category=water-sports', key: 'heroWater' as const, emoji: '🌊' },
  { href: '/?category=trekking', key: 'heroTrekking' as const, emoji: '🏔️' },
  { href: '/?category=combo', key: 'heroCombos' as const, emoji: '🔥' },
  { href: '/?category=tubing', key: 'heroTubing' as const, emoji: '🛶' },
];

function relativeBookingTime(bookedAt: string | Date, locale: 'en' | 'id'): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(bookedAt).getTime()) / 60000));
  if (minutes < 1) return locale === 'id' ? 'baru saja' : 'just now';
  if (minutes < 60) return locale === 'id' ? `${minutes} mnt lalu` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === 'id' ? `${hours} jam lalu` : `${hours}h ago`;
  return locale === 'id' ? `${Math.floor(hours / 24)} hari lalu` : `${Math.floor(hours / 24)}d ago`;
}

interface HomeHeroProps {
  hubs: readonly string[];
  suggestions: readonly HeroSuggestion[];
  stats: {
    categories: number;
    /** Average rating across products that have reviews, or null. */
    avgRating: number | null;
    reviewCount: number;
  };
  /** Latest real paid booking, if any. Never fabricated. */
  bookingPulse?: { title: string; location: string; bookedAt: Date } | null;
}

/**
 * Home hero: dark cinematic band with the search control, intent shortcuts and
 * live (real) booking proof so the catalogue starts above the fold.
 */
export function HomeHero({ hubs, suggestions, stats, bookingPulse }: HomeHeroProps) {
  const { t, locale } = useLocale();
  const [pulseTime, setPulseTime] = useState(() =>
    bookingPulse ? relativeBookingTime(bookingPulse.bookedAt, locale) : null
  );

  useEffect(() => {
    if (!bookingPulse) return;
    const tick = () => setPulseTime(relativeBookingTime(bookingPulse.bookedAt, locale));
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [bookingPulse, locale]);
  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-white">
      {/* Cinematic layer: drop /public/images/hero-bali.jpg to activate it; the
          scrim keeps headline contrast either way. */}
      {/* Cinematic layer: the supplied Bali collage. Next/Image serves the
          optimised format and marks it as the LCP image. */}
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src="/images/hero-bali.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={80}
          className="object-cover object-center opacity-70"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/35 lg:bg-transparent"
      />
      {/* Editorial scrim: deep on the copy side, clear on the image side. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/5"
      />
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

      <div className="container relative mx-auto px-4 pb-10 pt-14 sm:pt-20 lg:pb-16 lg:pt-24">
        <div>
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              {t('heroCategories')}
            </p>

            <h1 className="mt-6 max-w-3xl font-heading text-[clamp(1.35rem,6vw,3.25rem)] font-bold uppercase leading-[1.06] tracking-tight text-white">
              <span className="block whitespace-nowrap">
                {t('heroBook')} <RotatingKeyword />
              </span>
              <span className="mt-2 block">{t('heroOwn')}</span>
            </h1>

            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/70 sm:text-base">
              {t('heroSub')}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-white/80">
              {stats.avgRating !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-brand text-brand" aria-hidden="true" />
                  <strong className="font-semibold text-white">{stats.avgRating.toFixed(1)}</strong>
                  · {stats.reviewCount} {t('verifiedReviews')}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                {t('trustInstant')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                {t('licensed')}
              </span>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              {INTENT_PILLS.map((pill) => (
                <Link
                  key={pill.href}
                  href={pill.href}
                  className="inline-flex min-h-[38px] shrink-0 items-center rounded-full border border-white/20 bg-white/5 px-3 text-xs font-semibold text-white/80 backdrop-blur-[1px] transition-colors hover:border-brand hover:bg-brand/10 hover:text-brand"
                >
                  {pill.emoji} {t(pill.key)}
                </Link>
              ))}
            </div>

            {bookingPulse && pulseTime && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[11px] text-white/70">
                <Flame className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-white">{t('bookingAlert')}:</strong>{' '}
                  {bookingPulse.title} {t('bookingIn')} {bookingPulse.location} · {pulseTime}
                </span>
              </p>
            )}
          </div>

          <div className="mt-8 max-w-3xl">
            <HeroSearch hubs={hubs} suggestions={suggestions} />
          </div>
        </div>

        <p className="mt-6 hidden items-center gap-1.5 text-[11px] text-white/50 sm:inline-flex">
          <CheckCircle className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
          {t('idrNote')}
        </p>
      </div>

      {/* Bottom trust / social proof bar */}
      <div className="relative border-t border-white/10">
        <div className="container mx-auto flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3.5 text-[11px] text-white/70">
          {stats.avgRating !== null ? (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-brand text-brand" aria-hidden="true" />
              <strong className="font-semibold text-white">{stats.avgRating.toFixed(1)}</strong>
              · {stats.reviewCount} {t('reviews')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              {stats.categories} {t('categories')}
            </span>
          )}

          {TRUST_POINTS.map(({ icon: Icon, key }) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              {t(key)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
