import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { VentureExplorer } from '@/components/features/VentureExplorer';
import { ExploreFiltersProvider } from '@/components/features/ExploreFiltersProvider';
import { ExploreSearchCard } from '@/components/features/ExploreSearchCard';
import { CATEGORY_REGISTRY } from '@/lib/taxonomy';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';
import type { VentureItem } from '@/types/venture';

/**
 * Explore — the App Shell's discovery destination. Optimised for browsing on
 * the phone: category-first, the full catalogue below. Deliberately kept out
 * of the index because /experiences is the canonical SEO catalogue.
 */
export const metadata: Metadata = {
  title: 'Explore Bali Adventures | BaliWild',
  description: 'Browse every BaliWild adventure by category — ATV, rafting, tubing, snorkeling and more.',
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  let ventures: VentureItem[] = [];
  let source: 'database' | 'fallback' = 'database';

  try {
    const rows = await prisma.venture.findMany({
      orderBy: [{ rating: 'desc' }, { title: 'asc' }],
      take: 60,
      include: ventureWithRelations(),
    });
    ventures = rows.map(toVentureItem);
  } catch (error) {
    console.error('Failed to load ventures from the database:', error);
    source = 'fallback';
  }

  const categories = CATEGORY_REGISTRY;

  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <ExploreFiltersProvider>
      {/* Desktop search card — mobile uses the in-page top bar (State 1) instead */}
      <div className="hidden md:block">
        <ExploreSearchCard />
      </div>

      {/* Page Title */}
      <div className="container mx-auto px-4 pb-2 pt-2 md:py-6">
        <div className="flex items-center justify-between gap-4 mb-1">
          <h1 className="sr-only md:not-sr-only font-heading text-3xl font-bold text-neutral-900 dark:text-white">Explore</h1>
        </div>
      </div>

      {/* Adventure Cards */}
      <section className="container mx-auto px-4 pb-12">
        <h2 className="sr-only">All adventures</h2>
        {source === 'fallback' ? (
          <p className="py-8 text-center text-sm text-neutral-600" role="status">
            The catalogue is briefly unavailable — please refresh in a moment.
          </p>
        ) : ventures.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-neutral-600">No adventures yet.</p>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-ink px-6 text-base font-semibold text-white hover:bg-neutral-900"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 hidden text-sm text-neutral-600 md:block">
              {ventures.length} curated adventures across {categories.length} categories.
            </p>
            <VentureExplorer ventures={ventures} mode="explore" />
          </>
        )}
      </section>
      </ExploreFiltersProvider>
    </main>
  );
}