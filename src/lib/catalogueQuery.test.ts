import { getCataloguePage } from './catalogueQuery';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    venture: { findMany: jest.fn(), count: jest.fn() },
    $queryRawUnsafe: jest.fn(),
  },
}));

jest.mock('@/lib/ventureMapper', () => ({
  ventureWithRelations: jest.fn(() => ({})),
  toVentureItem: jest.fn((row: { id: string; title?: string }) => ({
    id: row.id,
    title: row.title ?? row.id,
  })),
}));

const findMany = prisma.venture.findMany as jest.Mock;
const count = prisma.venture.count as jest.Mock;
const queryRaw = prisma.$queryRawUnsafe as jest.Mock;

beforeEach(() => {
  findMany.mockReset().mockResolvedValue([]);
  count.mockReset().mockResolvedValue(0);
  queryRaw.mockReset().mockResolvedValue([]);
});

describe('getCataloguePage — rating and newest sorts', () => {
  it('pushes filter, ordering and LIMIT/OFFSET into Prisma', async () => {
    findMany.mockResolvedValue([{ id: 'v1', title: 'One' }]);
    count.mockResolvedValue(25);

    const result = await getCataloguePage({
      category: 'atv',
      query: 'ubud',
      sort: 'popular',
      page: 2,
      pageSize: 12,
    });

    expect(findMany.mock.calls[0][0]).toMatchObject({
      where: {
        // URL slug `atv` is stored in the database as the short label `ATV`.
        category: 'ATV',
        OR: [
          { title: { contains: 'ubud', mode: 'insensitive' } },
          { shortDescription: { contains: 'ubud', mode: 'insensitive' } },
        ],
      },
      orderBy: [{ rating: 'desc' }, { id: 'asc' }],
      skip: 12,
      take: 12,
    });
    expect(count).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.items.map((item) => item.id)).toEqual(['v1']);
  });

  it('uses createdAt for the newest sort and treats invalid sorts as popular', async () => {
    await getCataloguePage({ sort: 'newest' });
    expect(findMany.mock.calls[0][0].orderBy).toEqual([{ createdAt: 'desc' }, { id: 'asc' }]);

    await getCataloguePage({ sort: 'not-a-sort' });
    expect(findMany.mock.calls[1][0].orderBy).toEqual([{ rating: 'desc' }, { id: 'asc' }]);
  });

  it('clamps page and page size to safe values', async () => {
    await getCataloguePage({ page: -5, pageSize: 9999 });
    expect(findMany.mock.calls[0][0]).toMatchObject({ skip: 0, take: 48 });
  });
});

describe('getCataloguePage — category normalization', () => {
  it.each([
    ['atv', 'ATV'],
    ['water-sports', 'Water Sports'],
    ['ATV', 'ATV'],
    ['Water Sports', 'Water Sports'],
    ['snorkeling', 'Snorkeling'],
  ])('maps %s to the stored short label %s', async (input, expected) => {
    await getCataloguePage({ category: input });
    expect(findMany.mock.calls[0][0].where).toMatchObject({ category: expected });
  });

  it('keeps an unknown category as-is instead of guessing', async () => {
    await getCataloguePage({ category: 'hotels' });
    expect(findMany.mock.calls[0][0].where).toMatchObject({ category: 'hotels' });
  });
});

describe('getCataloguePage — price sorts', () => {
  it('orders by computed price in SQL and hydrates only the page rows', async () => {
    queryRaw.mockResolvedValueOnce([
      { id: 'b', total: 30 },
      { id: 'a', total: 30 },
    ]);
    findMany.mockResolvedValueOnce([{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }]);

    const result = await getCataloguePage({ sort: 'price-asc', page: 1, pageSize: 12 });

    expect(queryRaw).toHaveBeenCalledTimes(1);
    // Hydrated rows are re-ordered to match the SQL page order.
    expect(result.items.map((item) => item.id)).toEqual(['b', 'a']);
    expect(result.total).toBe(30);
    expect(result.totalPages).toBe(3);
    // Only one findMany: the page rows, not the whole catalogue.
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0][0].where).toEqual({ id: { in: ['b', 'a'] } });
    expect(count).not.toHaveBeenCalled();
  });

  it('returns an empty page without hydrating anything when there are no ids', async () => {
    queryRaw.mockResolvedValueOnce([]);

    const result = await getCataloguePage({ sort: 'price-desc' });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
  });
});
