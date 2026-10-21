import { prisma } from '@/lib/prisma';
import { mockExperiences } from '@/data/mockExperiences';
import { toVentureItem, ventureWithRelations } from '@/lib/ventureMapper';
import type { VentureItem } from '@/types/venture';

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

    return { ventures: rows.map(toVentureItem), source: 'database' };
  } catch (error) {
    console.error('Failed to load ventures from the database, using fallback:', error);
    return { ventures: mockExperiences, source: 'fallback' };
  }
}
