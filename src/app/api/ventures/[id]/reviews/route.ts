import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  histogramFromCounts,
  parseReviewFeedParams,
  reviewFeedOrderBy,
  reviewFeedWhere,
  toReviewSummary,
} from '@/lib/reviewFeed';

export const dynamic = 'force-dynamic';

/**
 * Public, paginated review feed for a product page.
 *
 * Only approved reviews are exposed. Search and sort run in the database so the
 * modal can page through a large history without shipping every comment in the
 * initial page payload.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { page, pageSize, query, sort } = parseReviewFeedParams(request.nextUrl.searchParams);

  try {
    const venture = await prisma.venture.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!venture) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Adventure not found' } },
        { status: 404 }
      );
    }

    const where = reviewFeedWhere(params.id, query);

    const [total, filteredTotal, rows, grouped, aggregate] = await Promise.all([
      prisma.review.count({ where: { ventureId: params.id, isApproved: true } }),
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: { customer: { select: { name: true, countryCode: true } } },
        orderBy: reviewFeedOrderBy(sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { ventureId: params.id, isApproved: true },
        _count: { _all: true },
      }),
      prisma.review.aggregate({
        where: { ventureId: params.id, isApproved: true },
        _avg: { rating: true },
      }),
    ]);

    const histogram = histogramFromCounts(
      grouped.map((item) => ({ rating: item.rating, count: item._count._all }))
    );

    return NextResponse.json({
      success: true,
      data: {
        reviews: rows.map(toReviewSummary),
        page,
        pageSize,
        total: filteredTotal,
        overallTotal: total,
        totalPages: Math.max(1, Math.ceil(filteredTotal / pageSize)),
        hasMore: page * pageSize < filteredTotal,
        average: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(2)) : 0,
        histogram,
      },
    });
  } catch (error) {
    console.error('Review feed failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not load reviews' } },
      { status: 500 }
    );
  }
}
