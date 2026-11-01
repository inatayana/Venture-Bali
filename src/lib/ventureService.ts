import { prisma } from '@/lib/prisma';
import { mockExperiences } from '@/data/mockExperiences';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';
import type { VentureItem } from '@/types/venture';

/** First and last day of the current month as YYYY-MM-DD (local time). */
export function currentMonthRange(reference: Date = new Date()): { start: string; end: string } {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const pad = (value: number) => String(value).padStart(2, '0');
  const lastDay = new Date(year, month + 1, 0).getDate();

  return {
    start: `${year}-${pad(month + 1)}-01`,
    end: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  };
}

/**
 * Paid guests per venture for the current month — the "N booked this month"
 * proof point on the catalogue and product page.
 */
export async function getMonthlyGuestCounts(
  reference: Date = new Date()
): Promise<Map<string, number>> {
  try {
    const { start, end } = currentMonthRange(reference);
    const rows = await prisma.booking.findMany({
      where: {
        paymentStatus: 'PAID',
        bookingDate: { gte: start, lte: end },
      },
      select: { paxCount: true, variant: { select: { ventureId: true } } },
    });

    const counts = new Map<string, number>();
    for (const row of rows) {
      const ventureId = row.variant?.ventureId;
      if (!ventureId) continue;
      counts.set(ventureId, (counts.get(ventureId) ?? 0) + row.paxCount);
    }
    return counts;
  } catch (error) {
    console.error('Could not compute monthly guest counts:', error);
    return new Map();
  }
}

/**
 * Load every venture for the catalogue page.
 *
 * Reads from the database and falls back to the offline catalogue when no
 * database is reachable, so demo and preview builds still render.
 */
export async function loadVentures(): Promise<{
  ventures: VentureItem[];
  source: 'database' | 'fallback';
}> {
  try {
    const rows = await prisma.venture.findMany({
      include: ventureWithRelations,
      orderBy: [{ rating: 'desc' }, { title: 'asc' }],
    });

    if (rows.length === 0) {
      return { ventures: mockExperiences, source: 'fallback' };
    }

    const monthlyGuests = await getMonthlyGuestCounts();
    return {
      ventures: rows.map((row) => ({
        ...toVentureItem(row),
        bookedThisMonth: monthlyGuests.get(row.id) ?? 0,
      })),
      source: 'database',
    };
  } catch (error) {
    console.error('Failed to load ventures from the database, using fallback:', error);
    return { ventures: mockExperiences, source: 'fallback' };
  }
}
