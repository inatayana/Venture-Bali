import Link from 'next/link';
import { Compass, Mail, Search } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { BRAND_EMAIL_SUPPORT } from '@/lib/brand';

/**
 * 404 boundary. Keeps the guest inside the catalogue instead of dropping them
 * on a generic framework page.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <Link href="/" aria-label="BaliWild home" className="inline-flex">
          <BrandWordmark className="text-2xl text-foreground" />
        </Link>

        <div className="mt-8 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/30 text-foreground">
            <Compass className="h-7 w-7" aria-hidden="true" />
          </span>
        </div>

        <p className="mt-4 font-heading text-sm font-bold uppercase tracking-[0.18em] text-foreground-muted">
          404 · Off the map
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold uppercase tracking-wide text-foreground">
          Lost in the wild?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
          We could not find that page. It may have moved, or the link is incomplete. Start again from
          the catalogue.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand-ink px-6 text-sm font-semibold uppercase tracking-wider text-brand transition-colors hover:bg-neutral-900 sm:w-auto"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse adventures
          </Link>
          <a
            href={`mailto:${BRAND_EMAIL_SUPPORT}`}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border-2 border-line-control px-6 text-sm font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-brand sm:w-auto"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Contact support
          </a>
        </div>
      </div>
    </main>
  );
}
