import { HomeHero } from '@/components/features/HomeHero';
import { TrustStrip } from '@/components/features/TrustStrip';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { HomeHeader } from '@/components/layout/HomeHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { loadVentures } from '@/lib/ventureService';
import { generateWebsiteStructuredData, getBaseUrl } from '@/lib/seo';
import { CuratedRows } from '@/components/features/CuratedRows';
import { VentureCard } from '@/components/ui';
import { ShieldCheck, ChevronRight } from 'lucide-react';

export const revalidate = 60;

export default async function Home() {
  const { ventures, source } = await loadVentures();

  return (
    <main className="min-h-screen bg-neutral-50">
      <JsonLd data={generateWebsiteStructuredData(getBaseUrl())} />
      <HomeHeader />

      <HomeHero />

      {/* Section 1 & 2: Curated horizontal rows */}
      <section className="px-4 sm:px-6 lg:px-10 pt-4 md:pt-7 pb-0">
        <div className="max-w-[1440px] mx-auto">
          <CuratedRows ventures={ventures} source={source} referenceDate={source === 'fallback' ? '2026-01-01' : new Date().toISOString().split('T')[0]} />
        </div>
      </section>

      {/* Section 3: Direct Operator Guarantee Strip + Explore All Guided Adventures */}
      <section className="px-4 sm:px-6 lg:px-10 pt-7 md:pt-10 pb-16">
        <div className="max-w-[1440px] mx-auto space-y-7 md:space-y-10">
          {/* Guarantee Strip */}
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-brand-ink px-6 py-4 text-center text-white dark:bg-neutral-900">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            <p className="text-sm font-semibold sm:text-base">
              100% Locally Owned & Operated in Bali
              <span className="text-white/60">
                {' '}— Empowering Local Guides · Safety-Checked Equipment · 24/7 Personal Concierge
              </span>
            </p>
          </div>

          {/* Section 3 Title + Show More - stacked on mobile, side-by-side on desktop */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-heading text-2xl font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                Explore All Guided Adventures
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Guided local trips · Safety-checked gear · Transparent pricing
              </p>
            </div>
            <a
              href="/explore"
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900 dark:border-white/10 dark:bg-neutral-800 dark:text-white"
            >
              Show More Adventures
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          {/* Grid: desktop = 5-col vertical grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-5">
            {ventures.map((venture) => (
              <VentureCard
                key={venture.id}
                venture={venture}
                href={`/experiences/${venture.id}/${venture.slug}`}
                variant="vertical"
              />
            ))}
          </div>

          {/* Mobile: horizontal split cards list */}
          <div className="flex flex-col gap-4 md:hidden">
            {ventures.map((venture) => (
              <VentureCard
                key={venture.id}
                venture={venture}
                href={`/experiences/${venture.id}/${venture.slug}`}
                variant="horizontal"
              />
            ))}
            {/* Show More button at bottom of mobile list */}
            <a
              href="/explore"
              className="mt-4 w-full inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900 dark:border-white/10 dark:bg-neutral-800 dark:text-white"
            >
              Show More Adventures
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <TrustStrip />

      {source === 'fallback' && (
        <p className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pb-8 text-xs text-gray-600 text-center">
          Showing the offline catalogue. Connect a database to browse the full inventory.
        </p>
      )}

      <SiteFooter />
    </main>
  );
}