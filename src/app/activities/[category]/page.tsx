import { Metadata } from 'next';
import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { VentureExplorer } from '@/components/features/VentureExplorer';
import { CategoryQuickMenu } from '@/components/features/CategoryQuickMenu';
import { CatalogueSortMenu } from '@/components/features/CatalogueSortMenu';
import { BrandWordmark } from '@/components/layout/BrandWordmark';
import { generateCategoryMetadata, generateCategoryStructuredData } from '@/lib/seo';
import { resolveCategory } from '@/lib/taxonomy';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  return generateCategoryMetadata(category);
}

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const { sort, page } = await searchParams;
  const sortValue = sort ?? 'popular';
  const pageNum = Math.max(1, parseInt(page ?? '1', 10));
  const pageSize = 12;

  const categoryDef = resolveCategory(categorySlug);
  if (!categoryDef) {
    // Category not found — return 404 via notFound()
    const { notFound } = await import('next/navigation');
    notFound();
  }
  // TypeScript doesn't narrow after notFound() throw, so assert non-null
  const cat = categoryDef!;

  // NOTE: the Venture model has no isActive column and the price lives on
  // Variant/PriceTier, so price sorting happens in memory below.
  const where: Prisma.VentureWhereInput = { category: categorySlug };

  const rows = await prisma.venture.findMany({
    where,
    include: ventureWithRelations(),
  });

  // Sort and paginate in memory: "popular" ranks by rating, price sorts use
  // the computed price.
  const allItems = rows.map(toVentureItem);
  const sorted =
    sortValue === 'price-asc'
      ? [...allItems].sort((a, b) => a.priceIdr - b.priceIdr)
      : sortValue === 'price-desc'
      ? [...allItems].sort((a, b) => b.priceIdr - a.priceIdr)
      : sortValue === 'newest'
      ? [...allItems].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      : [...allItems].sort((a, b) => b.rating - a.rating);

  const total = allItems.length;
  const totalPages = Math.ceil(total / pageSize);
  const ventureItems = sorted.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  // Build URL for sort links
  const buildSortUrl = (value: string) => {
    const url = new URL(`/activities/${categorySlug}`, getBaseUrl());
    url.searchParams.set('sort', value);
    return url.toString();
  };

  // Build URL for pagination
  const buildPageUrl = (pageNum: number) => {
    const url = new URL(`/activities/${categorySlug}`, getBaseUrl());
    if (sortValue !== 'popular') url.searchParams.set('sort', sortValue);
    if (pageNum > 1) url.searchParams.set('page', String(pageNum));
    return url.toString();
  };

  const structuredData = generateCategoryStructuredData(cat, getBaseUrl());

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-neutral-50">
        {/* Hero */}
        <section className="relative bg-brand-ink text-white py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <Link href="/" className="inline-block mb-6" aria-label="BaliWild home">
              <BrandWordmark className="text-2xl" />
            </Link>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl" aria-hidden="true">{cat.emoji}</span>
              <h1 className="font-heading text-3xl lg:text-4xl font-bold">
                {cat.canonical} Adventures in Bali
              </h1>
            </div>
            <p className="text-brand/80 max-w-2xl">
              {cat.description || `Discover ${total} curated ${cat.canonical.toLowerCase()} experiences in Bali. Instant booking, free cancellation, mobile-first.`}
            </p>
          </div>
        </section>

        {/* Category Quick Menu */}
        <section className="container mx-auto px-4 py-6 -mt-6">
          <CategoryQuickMenu currentCategory={cat.canonical} />
        </section>

        {/* Toolbar: Sort + Results count */}
        <section className="container mx-auto px-4 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CatalogueSortMenu
                value={sortValue}
                urls={{
                  popular: buildSortUrl('popular'),
                  'price-asc': buildSortUrl('price-asc'),
                  'price-desc': buildSortUrl('price-desc'),
                  newest: buildSortUrl('newest'),
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
            Showing {((pageNum - 1) * pageSize) + 1}–{Math.min(pageNum * pageSize, total)} of {total} {cat.canonical.toLowerCase()} adventures.
          </p>
        </section>

        {/* Grid */}
        <section className="container mx-auto px-4 pb-12">
          {ventureItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-600 mb-4">No {cat.canonical.toLowerCase()} adventures found.</p>
              <Link
                href="/experiences"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-white hover:bg-neutral-900"
              >
                Browse all adventures
              </Link>
            </div>
          ) : (
            <>
              <VentureExplorer ventures={ventureItems} />
              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                  {pageNum > 1 && (
                    <Link
                      href={buildPageUrl(pageNum - 1)}
                      className="min-h-[44px] px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="min-h-[44px] flex items-center px-4 text-neutral-600">
                    Page {pageNum} of {totalPages}
                  </span>
                  {pageNum < totalPages && (
                    <Link
                      href={buildPageUrl(pageNum + 1)}
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
    </>
  );
}

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://baliwild.com').replace(/\/$/, '');
}