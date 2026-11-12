import Link from 'next/link';
import { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { VentureExplorer } from '@/components/features/VentureExplorer';
import { CategoryQuickMenu } from '@/components/features/CategoryQuickMenu';
import { SortMenu } from '@/components/features/SortMenu';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { generateExperiencesMetadata } from '@/lib/seo';
import { CATEGORY_REGISTRY } from '@/lib/taxonomy';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';

export const metadata: Metadata = generateExperiencesMetadata();

export const dynamic = 'force-dynamic';

interface ExperiencesPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function ExperiencesPage({ searchParams }: ExperiencesPageProps) {
  const params = await searchParams;
  const category = params.category ?? null;
  const sort = params.sort ?? 'popular';
  const query = params.q ?? '';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const pageSize = 12;

  // Build where clause. NOTE: the Venture model has no isActive column and
  // the price lives on Variant/PriceTier, so price sorting happens in memory
  // below — the catalogue is small enough for that today.
  const where: Prisma.VentureWhereInput = {};
  if (category) {
    where.category = category;
  }
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { shortDescription: { contains: query, mode: 'insensitive' } },
    ];
  }

  const rows = await prisma.venture.findMany({
    where,
    include: ventureWithRelations(),
  });

  const categories = CATEGORY_REGISTRY;

  // Map Prisma ventures to VentureItem view models, then sort and paginate in
  // memory: "popular" ranks by rating, price sorts use the computed price.
  const allItems = rows.map(toVentureItem);
  const sorted =
    sort === 'price-asc'
      ? [...allItems].sort((a, b) => a.priceIdr - b.priceIdr)
      : sort === 'price-desc'
      ? [...allItems].sort((a, b) => b.priceIdr - a.priceIdr)
      : sort === 'newest'
      ? [...allItems].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      : [...allItems].sort((a, b) => b.rating - a.rating);

  const total = allItems.length;
  const totalPages = Math.ceil(total / pageSize);
  const ventureItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Build URL for sort links
  const buildSortUrl = (value: string) => {
    const url = new URL(`/experiences`, getBaseUrl());
    if (category) url.searchParams.set('category', category);
    if (query) url.searchParams.set('q', query);
    url.searchParams.set('sort', value);
    return url.toString();
  };

  // Build URL for pagination
  const buildPageUrl = (pageNum: number) => {
    const url = new URL(`/experiences`, getBaseUrl());
    if (category) url.searchParams.set('category', category);
    if (query) url.searchParams.set('q', query);
    if (sort !== 'popular') url.searchParams.set('sort', sort);
    if (pageNum > 1) url.searchParams.set('page', String(pageNum));
    return url.toString();
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="relative bg-brand-ink text-white py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-block mb-6" aria-label="BaliWild home">
            <BrandWordmark className="text-2xl" />
          </Link>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-3">
            All Adventures in Bali
          </h1>
          <p className="text-brand/80 max-w-2xl">
            Discover {total} curated activities — from sunrise ATV rides to river tubing,
            jungle swings to sunset cruises. Book instantly with free cancellation.
          </p>
        </div>
      </section>

      {/* Category Quick Menu */}
      <section className="container mx-auto px-4 py-6 -mt-6">
        <CategoryQuickMenu currentCategory={category ?? 'All'} />
      </section>

      {/* Toolbar: Search + Sort + Results count */}
      <section className="container mx-auto px-4 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <form className="flex-1 max-w-md" role="search">
            <label htmlFor="search" className="sr-only">Search adventures</label>
            <div className="relative">
              <input
                id="search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search ATV, rafting, tubing..."
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
              />
            </div>
          </form>
          <div className="flex items-center gap-3">
            <SortMenu
              value={sort}
              onChange={(value) => {
                window.location.href = buildSortUrl(value);
              }}
              options={[
                { value: 'popular', label: 'Most popular' },
                { value: 'price-asc', label: 'Price: low to high' },
                { value: 'price-desc', label: 'Price: high to low' },
                { value: 'newest', label: 'Newest first' },
              ]}
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-600">
          Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} adventures
          {category && ` in ${categories.find((c) => c.slug === category)?.canonical ?? category}`}
          {query && ` matching "${query}"`}.
        </p>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-4 pb-12">
        {ventureItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-600 mb-4">No adventures found.</p>
            <Link
              href="/experiences"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-white hover:bg-neutral-900"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <>
            <VentureExplorer ventures={ventureItems} />
            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                {page > 1 && (
                  <Link
                    href={buildPageUrl(page - 1)}
                    className="min-h-[44px] px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  >
                    Previous
                  </Link>
                )}
                <span className="min-h-[44px] flex items-center px-4 text-neutral-600">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildPageUrl(page + 1)}
                    className="min-h-[44px] px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://baliwild.com').replace(/\/$/, '');
}