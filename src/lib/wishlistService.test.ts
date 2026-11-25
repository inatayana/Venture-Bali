import { prisma } from '@/lib/prisma';
import { setWishlistItem, syncWishlist, toWishlistItem } from './wishlistService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customerWishlist: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    venture: { findMany: jest.fn(), findFirst: jest.fn() },
  },
}));

const mockedFindMany = prisma.customerWishlist.findMany as jest.Mock;
const mockedCreateMany = prisma.customerWishlist.createMany as jest.Mock;
const mockedUpsert = prisma.customerWishlist.upsert as jest.Mock;
const mockedDelete = prisma.customerWishlist.deleteMany as jest.Mock;
const mockedVentures = prisma.venture.findMany as jest.Mock;
const mockedVentureFirst = prisma.venture.findFirst as jest.Mock;

const ventureRow = {
  id: 'vtr-1',
  slug: 'mount-batur',
  title: 'Mount Batur Sunrise Trek',
  imageUrl: '/images/batur.jpg',
  category: 'Trekking',
  duration: '3 hrs',
  rating: 4.9,
  badge: 'Trending',
  variants: [
    { promoPriceIdr: 450000, priceTiers: [{ pricePerPax: 600000 }] },
    { promoPriceIdr: null, priceTiers: [{ pricePerPax: 500000 }] },
  ],
  reviews: [{ id: 'r1' }, { id: 'r2' }],
};

describe('wishlistService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps a row to the client wishlist shape using the lowest price', () => {
    const item = toWishlistItem({ savedAt: new Date('2026-11-25T00:00:00Z'), venture: ventureRow });

    expect(item).toMatchObject({
      id: 'vtr-1',
      slug: 'mount-batur',
      priceFromIdr: 450000,
      reviewCount: 2,
      badge: 'Trending',
      savedAt: Date.parse('2026-11-25T00:00:00Z'),
    });
  });

  it('merges only ventures that belong to the tenant', async () => {
    mockedVentures.mockResolvedValue([{ id: 'vtr-1' }]);
    mockedFindMany.mockResolvedValue([{ savedAt: new Date(), venture: ventureRow }]);

    await syncWishlist('acc-1', 'tenant-001', [
      { ventureId: 'vtr-1' },
      { ventureId: 'stale-id' },
      { ventureId: 'vtr-1' },
    ]);

    expect(mockedCreateMany).toHaveBeenCalledTimes(1);
    expect(mockedCreateMany.mock.calls[0][0].data).toHaveLength(1);
    expect(mockedCreateMany.mock.calls[0][0].data[0]).toMatchObject({
      accountId: 'acc-1',
      tenantId: 'tenant-001',
      ventureId: 'vtr-1',
    });
  });

  it('scopes reads by account and tenant', async () => {
    mockedFindMany.mockResolvedValue([]);
    await syncWishlist('acc-1', 'tenant-001', []);
    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { accountId: 'acc-1', tenantId: 'tenant-001' } }),
    );
  });

  it('adds and removes items through the composite unique key', async () => {
    mockedVentureFirst.mockResolvedValue({ id: 'vtr-1' });

    expect(await setWishlistItem('acc-1', 'tenant-001', 'vtr-1', true)).toBe(true);
    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { accountId_ventureId: { accountId: 'acc-1', ventureId: 'vtr-1' } } }),
    );

    expect(await setWishlistItem('acc-1', 'tenant-001', 'vtr-1', false)).toBe(true);
    expect(mockedDelete).toHaveBeenCalledWith({
      where: { accountId: 'acc-1', tenantId: 'tenant-001', ventureId: 'vtr-1' },
    });
  });

  it('refuses to save a venture from another tenant', async () => {
    mockedVentureFirst.mockResolvedValue(null);
    expect(await setWishlistItem('acc-1', 'tenant-001', 'foreign', true)).toBe(false);
    expect(mockedUpsert).not.toHaveBeenCalled();
  });
});
