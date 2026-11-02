import Link from 'next/link';
import { Facebook, Instagram, Mail, MapPin, Music2, ShieldCheck, Sparkles, Youtube } from 'lucide-react';
import { CATEGORY_REGISTRY } from '@/lib/taxonomy';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import {
  BRAND_EMAIL_HELLO,
  BRAND_EMAIL_PARTNERS,
  BRAND_EMAIL_SUPPORT,
  BRAND_SOCIALS,
} from '@/lib/brand';

const PAYMENT_BADGES = ['VISA', 'Mastercard', 'GoPay', 'QRIS', 'Bank transfer'];

/**
 * Customer-facing footer. Deliberately brand-only: no vendor or partner names
 * (AGENTS.md §9), and only links to pages that exist.
 *
 * Black surface + white text, with the brand accent on the wordmark only.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-white">
              <BrandWordmark className="text-lg" />
            </p>
            <p className="mt-2 font-heading text-sm font-bold uppercase tracking-[0.18em] text-brand">
              Own the wild.
            </p>
            <p className="mt-2 max-w-xs text-sm text-white/70">
              Adventure bookings across Bali with licensed local operators — instant confirmation and
              free reschedule up to 24 hours before.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/50">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Ubud, Gianyar · Bali, Indonesia
            </p>
            <a
              href={`mailto:${BRAND_EMAIL_HELLO}`}
              className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-xs text-white/60 transition-colors hover:text-brand"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {BRAND_EMAIL_HELLO}
            </a>
            <div className="mt-3 flex items-center gap-2">
              <a
                href={BRAND_SOCIALS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BaliWild on Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-brand hover:text-brand"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={BRAND_SOCIALS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BaliWild on TikTok"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-brand hover:text-brand"
              >
                <Music2 className="h-4 w-4" />
              </a>
              <a
                href={BRAND_SOCIALS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BaliWild on YouTube"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-brand hover:text-brand"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href={BRAND_SOCIALS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BaliWild on Facebook"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-brand hover:text-brand"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-3 flex items-center gap-2 text-white/70 [&_button:hover]:bg-white/10">
              <LanguageSwitcher />
              <CurrencySelector />
              <ThemeSwitcher />
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">
              Adventures
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {CATEGORY_REGISTRY.map((category) => (
                <li key={category.slug} className="min-w-0">
                  <Link
                    href={`/?category=${category.slug}`}
                    className="inline-flex min-h-[44px] max-w-full items-center gap-1.5 text-white/70 transition-colors hover:text-brand focus-visible:text-brand"
                  >
                    <span className="w-5 shrink-0 text-center" aria-hidden="true">
                      {category.emoji}
                    </span>
                    <span className="truncate">{category.short}</span>
                  </Link>
                </li>
              ))}
              <li className="min-w-0">
                <Link
                  href="/"
                  className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-brand transition-colors hover:text-white"
                >
                  All adventures <span aria-hidden="true">→</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">
              Booking help
            </h2>
            <ul className="mt-2 space-y-0 text-sm">
              <li>
                <Link href="/terms" className="inline-flex min-h-[44px] items-center text-white/70 transition-colors hover:text-brand">
                  Booking terms
                </Link>
              </li>
              <li>
                <Link href="/waiver" className="inline-flex min-h-[44px] items-center text-white/70 transition-colors hover:text-brand">
                  Safety waiver
                </Link>
              </li>
              <li>
                <Link href="/blog" className="inline-flex min-h-[44px] items-center text-white/70 transition-colors hover:text-brand">
                  Bali adventure guides
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="inline-flex min-h-[44px] items-center text-white/70 transition-colors hover:text-brand">
                  Privacy policy
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${BRAND_EMAIL_SUPPORT}`}
                  className="inline-flex min-h-[44px] items-center text-white/70 transition-colors hover:text-brand"
                >
                  {BRAND_EMAIL_SUPPORT}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BRAND_EMAIL_PARTNERS}`}
                  className="inline-flex min-h-[44px] items-center text-white/70 transition-colors hover:text-brand"
                >
                  Partner with us · {BRAND_EMAIL_PARTNERS}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">
              Why book here
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
                Instant confirmation on every package
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
                80% refund when cancelling ≥24h before
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
                Secure checkout · no card details stored
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {PAYMENT_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-white/20 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/60"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 pr-16 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} BaliWild. Adventure travel, locally operated.</p>
          <p>Prices in IDR · USD shown for reference · Made in Bali</p>
        </div>
      </div>
    </footer>
  );
}
