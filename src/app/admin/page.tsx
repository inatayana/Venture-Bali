import { prisma } from '@/lib/prisma';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

interface DashboardStats {
  ventureCount: number;
  variantCount: number;
  bookingCount: number;
  paidCount: number;
  pendingCount: number;
  cancelledCount: number;
  revenueIdr: number;
  articleCount: number;
  vendorCount: number;
  zoneCount: number;
}

interface RecentBooking {
  id: string;
  bookingCode: string;
  totalPrice: number;
  paymentStatus: string;
  customer?: { name: string; email: string } | null;
  variant?: { title: string; venture?: { title: string } | null } | null;
}

async function loadStats(): Promise<DashboardStats> {
  try {
    const [ventureCount, variantCount, bookingCount, paidCount, pendingCount, cancelledCount, articleCount, vendorCount, zoneCount] =
      await Promise.all([
        prisma.venture.count(),
        prisma.variant.count(),
        prisma.booking.count(),
        prisma.booking.count({ where: { paymentStatus: 'PAID' } }),
        prisma.booking.count({ where: { paymentStatus: 'PENDING' } }),
        prisma.booking.count({ where: { paymentStatus: 'CANCELLED' } }),
        prisma.article.count(),
        prisma.vendor.count(),
        prisma.pickupZone.count(),
      ]);

    const paidBookings = await prisma.booking.findMany({
      where: { paymentStatus: 'PAID' },
      select: { totalPrice: true },
    });

    const revenueIdr = paidBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

    return {
      ventureCount,
      variantCount,
      bookingCount,
      paidCount,
      pendingCount,
      cancelledCount,
      revenueIdr,
      articleCount,
      vendorCount,
      zoneCount,
    };
  } catch (error) {
    console.warn('Database unavailable for admin dashboard, using mock stats:', error);
    return {
      ventureCount: 9,
      variantCount: 18,
      bookingCount: 0,
      paidCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
      revenueIdr: 0,
      articleCount: 0,
      vendorCount: 0,
      zoneCount: 0,
    };
  }
}

async function loadRecentBookings(): Promise<RecentBooking[]> {
  try {
    return await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        customer: { select: { name: true, email: true } },
        variant: { select: { title: true, venture: { select: { title: true } } } },
      },
    });
  } catch (error) {
    console.warn('Database unavailable for recent bookings:', error);
    return [];
  }
}

export default async function AdminDashboardPage() {
  const [stats, recentBookings] = await Promise.all([loadStats(), loadRecentBookings()]);

  return <DashboardClient stats={stats} recentBookings={recentBookings} />;
}