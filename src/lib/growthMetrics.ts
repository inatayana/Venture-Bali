/**
 * Growth KPIs derived only from persisted data. No estimates, no fabricated
 * traffic numbers — organic sessions and rankings belong to GA4/GSC, not here.
 */

import { prisma } from '@/lib/prisma';

export interface GrowthMetrics {
  generatedAt: string;
  catalogue: {
    ventures: number;
    publishedArticles: number;
    totalArticles: number;
    articlesLast30Days: number;
    approvedReviews: number;
  };
  conversion: {
    bookings: number;
    bookingsLast30Days: number;
    paidBookings: number;
    paidBookingsLast30Days: number;
    paidRevenueIdr: number;
  };
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function getGrowthMetrics(now: Date = new Date()): Promise<GrowthMetrics> {
  const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);

  const [
    ventures,
    publishedArticles,
    totalArticles,
    articlesLast30Days,
    approvedReviews,
    bookings,
    bookingsLast30Days,
    paidBookings,
    paidBookingsLast30Days,
    revenue,
  ] = await Promise.all([
    prisma.venture.count(),
    prisma.article.count({ where: { publishedAt: { not: null } } }),
    prisma.article.count(),
    prisma.article.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.review.count({ where: { isApproved: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.count({ where: { paymentStatus: 'PAID' } }),
    prisma.booking.count({
      where: { paymentStatus: 'PAID', createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { grossAmount: true },
    }),
  ]);

  return {
    generatedAt: now.toISOString(),
    catalogue: {
      ventures,
      publishedArticles,
      totalArticles,
      articlesLast30Days,
      approvedReviews,
    },
    conversion: {
      bookings,
      bookingsLast30Days,
      paidBookings,
      paidBookingsLast30Days,
      paidRevenueIdr: revenue._sum.grossAmount ?? 0,
    },
  };
}
