import Link from 'next/link';
import { MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { CATEGORY_REGISTRY } from '@/lib/taxonomy';

const PAYMENT_BADGES = ['VISA', 'Mastercard', 'GoPay', 'QRIS', 'Bank transfer'];

/**
 * Customer-facing footer. Deliberately brand-only: no vendor or partner names
 * (AGENTS.md §9), and only links to pages that exist.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-heading text-lg font-bold uppercase tracking-wider text-brand-ink">
              Venture <span className="bg-brand px-1">Bali</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-neutral-600">
              Adventure bookings across Bali with licensed local operators — instant confirmation and
              free reschedule up to 24 hours before.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Ubud, Gianyar · Bali, Indonesia
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
              Adventures
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {CATEGORY_REGISTRY.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/?category=${category.slug}`}
                    className="text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    {category.emoji} {category.short}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
              Booking help
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <Link href="/terms" className="text-neutral-600 hover:text-neutral-900">
                  Booking terms
                </Link>
              </li>
              <li>
                <Link href="/waiver" className="text-neutral-600 hover:text-neutral-900">
                  Safety waiver
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-neutral-600 hover:text-neutral-900">
                  Bali adventure guides
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
              Why book here
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                Instant confirmation on every package
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                80% refund when cancelling ≥24h before
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                Secure checkout · no card details stored
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {PAYMENT_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-neutral-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-neutral-100 pt-5 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Venture Bali. Adventure travel, locally operated.</p>
          <p>Prices in IDR · USD shown for reference · Made in Bali</p>
        </div>
      </div>
    </footer>
  );
}
