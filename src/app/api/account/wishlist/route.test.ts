/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { requireCustomer } from '@/lib/customerGuard';
import { listWishlist, syncWishlist } from '@/lib/wishlistService';

jest.mock('@/lib/customerGuard', () => ({ requireCustomer: jest.fn() }));
jest.mock('@/lib/wishlistService', () => ({
  listWishlist: jest.fn(),
  syncWishlist: jest.fn(),
}));

const mockedRequire = requireCustomer as jest.Mock;
const mockedList = listWishlist as jest.Mock;
const mockedSync = syncWishlist as jest.Mock;

const user = {
  accountId: 'acc-1',
  customerId: 'customer-1',
  name: 'Guest',
  email: 'guest@example.com',
  tenantId: 'tenant-001',
  status: 'ACTIVE' as const,
  joinedAt: '2026-11-01T00:00:00.000Z',
  whatsapp: '6281234567890',
  countryCode: 'ID',
};

function post(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/account/wishlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/account/wishlist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequire.mockResolvedValue(user);
    mockedList.mockResolvedValue([]);
    mockedSync.mockResolvedValue([]);
  });

  it('requires a customer session', async () => {
    mockedRequire.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await POST(post({ items: [] }))).status).toBe(401);
  });

  it('rejects oversized or malformed sync payloads', async () => {
    expect((await POST(post({ items: Array(201).fill({ ventureId: 'v1' }) }))).status).toBe(400);
    expect((await POST(post({ items: [{ ventureId: 42 }] }))).status).toBe(400);
    expect(mockedSync).not.toHaveBeenCalled();
  });

  it('merges guest items and returns the authoritative list', async () => {
    const items = [{ id: 'vtr-1', savedAt: 1 }];
    mockedSync.mockResolvedValue(items);

    const response = await POST(post({ items: [{ ventureId: 'vtr-1' }] }));

    expect(response.status).toBe(200);
    expect(mockedSync).toHaveBeenCalledWith('acc-1', 'tenant-001', [{ ventureId: 'vtr-1' }]);
    expect((await response.json()).data.items).toEqual(items);
  });

  it('lists only the signed-in account data', async () => {
    await GET();
    expect(mockedList).toHaveBeenCalledWith('acc-1', 'tenant-001');
  });
});
