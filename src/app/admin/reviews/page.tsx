import type { Prisma, ReviewSource } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AdminReviewQueue, type AdminReviewItem } from '@/components/admin/AdminReviewQueue';

export const dynamic = 'force-dynamic';

const REVIEW_TARGET_PER_PRODUCT = 10;
const SOURCES: ReviewSource[] = ['VERIFIED_BOOKING', 'FOUNDING_GUEST', 'IMPORTED'];
const STATUSES = ['pending', 'published', 'all'] as const;

interface AdminReviewsPageProps {
  searchParams: {
    status?: string;
    source?: string;
    venture?: string;
  };
}

function parsePhotos(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && /^https?:\/\//.test(item))
    .slice(0, 3);
}

function parseSource(value: string): ReviewSource {
  return SOURCES.includes(value as ReviewSource) ? (value as ReviewSource) : 'VERIFIED_BOOKING';
}

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const status = STATUSES.includes(searchParams.status as (typeof STATUSES)[number])
    ? (searchParams.status as (typeof STATUSES)[number])
    : 'pending';
  const source = searchParams.source && SOURCES.includes(searchParams.source as ReviewSource)
    ? (searchParams.source as ReviewSource)
    : null;
  const ventureId = searchParams.venture?.trim() || null;

  const where: Prisma.ReviewWhereInput = {};
  if (status === 'pending') where.isApproved = false;
  if (status === 'published') where.isApproved = true;
  if (source) where.source = source;
  if (ventureId) where.ventureId = ventureId;

  const [pendingCount, publishedCount, coverageRows, ventures, reviews] = await Promise.all([
    prisma.review.count({ where: { isApproved: false } }),
    prisma.review.count({ where: { isApproved: true } }),
    prisma.review.groupBy({
      by: ['ventureId', 'isApproved'],
      _count: { _all: true },
    }),
    prisma.venture.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        venture: { select: { id: true, title: true } },
        customer: { select: { name: true } },
        booking: { select: { bookingCode: true, bookingDate: true } },
      },
    }),
  ]);

  const coverage = new Map<string, { approved: number; pending: number }>();
  for (const row of coverageRows) {
    const current = coverage.get(row.ventureId) ?? { approved: 0, pending: 0 };
    if (row.isApproved) current.approved += row._count._all;
    else current.pending += row._count._all;
    coverage.set(row.ventureId, current);
  }

  const items: AdminReviewItem[] = reviews.map((review) => ({
    id: review.id,
    ventureId: review.venture.id,
    ventureTitle: review.venture.title,
    rating: review.rating,
    comment: review.comment,
    guestName: review.guestName?.trim() || review.customer.name,
    guestLocation: review.guestLocation?.trim() || null,
    bookingCode: review.booking?.bookingCode ?? null,
    bookingDate: review.booking?.bookingDate ?? null,
    source: parseSource(review.source),
    isApproved: review.isApproved,
    photos: parsePhotos(review.photos),
    createdAt: review.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pendingCount} waiting for moderation · {publishedCount} published
        </p>
      </header>

      <section>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Coverage · target {REVIEW_TARGET_PER_PRODUCT} published reviews per product
          </h2>
          <span className="text-xs text-gray-500">
            {ventures.filter((venture) => (coverage.get(venture.id)?.approved ?? 0) >= REVIEW_TARGET_PER_PRODUCT).length}
            /{ventures.length} products reached target
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {ventures.map((venture) => {
            const counts = coverage.get(venture.id) ?? { approved: 0, pending: 0 };
            const percent = Math.min(
              100,
              Math.round((counts.approved / REVIEW_TARGET_PER_PRODUCT) * 100)
            );
            return (
              <a
                key={venture.id}
                href={`/admin/reviews?status=all&venture=${venture.id}`}
                className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 transition-colors hover:border-gray-400"
              >
                <p className="truncate text-sm font-semibold text-gray-900">{venture.title}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                  <span>
                    {counts.approved}/{REVIEW_TARGET_PER_PRODUCT} published
                  </span>
                  <span>{counts.pending} pending</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <form method="get" className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <label className="text-xs font-semibold text-gray-600">
          Status
          <select
            name="status"
            defaultValue={status}
            className="mt-1 block min-h-[44px] rounded-lg border border-gray-300 px-2 text-sm text-gray-900"
          >
            <option value="pending">Pending</option>
            <option value="published">Published</option>
            <option value="all">All</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-600">
          Source
          <select
            name="source"
            defaultValue={source ?? ''}
            className="mt-1 block min-h-[44px] rounded-lg border border-gray-300 px-2 text-sm text-gray-900"
          >
            <option value="">All sources</option>
            <option value="VERIFIED_BOOKING">Verified booking</option>
            <option value="FOUNDING_GUEST">Founding guest</option>
            <option value="IMPORTED">Imported review</option>
          </select>
        </label>
        <label className="min-w-0 flex-1 text-xs font-semibold text-gray-600">
          Product
          <select
            name="venture"
            defaultValue={ventureId ?? ''}
            className="mt-1 block min-h-[44px] w-full rounded-lg border border-gray-300 px-2 text-sm text-gray-900"
          >
            <option value="">All products</option>
            {ventures.map((venture) => (
              <option key={venture.id} value={venture.id}>
                {venture.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white"
        >
          Apply
        </button>
        <a
          href="/admin/reviews"
          className="inline-flex min-h-[44px] items-center px-2 text-sm font-semibold text-gray-700 underline"
        >
          Reset
        </a>
      </form>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          {status === 'pending' ? 'Moderation queue' : status === 'published' ? 'Published reviews' : 'All reviews'}
        </h2>
        <AdminReviewQueue reviews={items} />
        {reviews.length === 100 && (
          <p className="mt-2 text-xs text-gray-500">
            Showing the latest 100 reviews. Narrow the filters to see older entries.
          </p>
        )}
      </section>
    </div>
  );
}
