import { getGrowthMetrics } from './growthMetrics';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    venture: { count: jest.fn() },
    article: { count: jest.fn() },
    review: { count: jest.fn() },
    booking: { count: jest.fn() },
    payment: { aggregate: jest.fn() },
  },
}));

const ventureCount = prisma.venture.count as jest.Mock;
const articleCount = prisma.article.count as jest.Mock;
const reviewCount = prisma.review.count as jest.Mock;
const bookingCount = prisma.booking.count as jest.Mock;
const paymentAggregate = prisma.payment.aggregate as jest.Mock;

beforeEach(() => {
  ventureCount.mockReset().mockResolvedValue(9);
  articleCount.mockReset().mockResolvedValue(0);
  reviewCount.mockReset().mockResolvedValue(0);
  bookingCount.mockReset().mockResolvedValue(0);
  paymentAggregate.mockReset().mockResolvedValue({ _sum: { grossAmount: null } });
});

describe('getGrowthMetrics', () => {
  it('derives every KPI from persisted data and never invents traffic', async () => {
    articleCount
      .mockResolvedValueOnce(12) // published
      .mockResolvedValueOnce(20) // total
      .mockResolvedValueOnce(3); // last 30 days
    reviewCount.mockResolvedValue(7);
    bookingCount
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(8);
    paymentAggregate.mockResolvedValue({ _sum: { grossAmount: 12_345_000 } });

    const metrics = await getGrowthMetrics(new Date('2026-11-22T00:00:00.000Z'));

    expect(metrics.generatedAt).toBe('2026-11-22T00:00:00.000Z');
    expect(metrics.catalogue).toMatchObject({
      ventures: 9,
      publishedArticles: 12,
      totalArticles: 20,
      articlesLast30Days: 3,
      approvedReviews: 7,
    });
    expect(metrics.conversion).toMatchObject({
      bookings: 100,
      bookingsLast30Days: 10,
      paidBookings: 80,
      paidBookingsLast30Days: 8,
      paidRevenueIdr: 12_345_000,
    });
    expect(paymentAggregate).toHaveBeenCalledWith({
      where: { status: 'PAID' },
      _sum: { grossAmount: true },
    });
  });

  it('treats an empty revenue sum as zero', async () => {
    const metrics = await getGrowthMetrics();
    expect(metrics.conversion.paidRevenueIdr).toBe(0);
  });
});
