/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';
import { requireCustomer } from '@/lib/customerGuard';
import { setWishlistItem } from '@/lib/wishlistService';

jest.mock('@/lib/customerGuard', () => ({ requireCustomer: jest.fn() }));
jest.mock('@/lib/wishlistService', () => ({ setWishlistItem: jest.fn() }));

const mockedRequire = requireCustomer as jest.Mock;
const mockedSet = setWishlistItem as jest.Mock;

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

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/account/wishlist/toggle', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/account/wishlist/toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequire.mockResolvedValue(user);
    mockedSet.mockResolvedValue(true);
  });

  it('rejects guests', async () => {
    mockedRequire.mockResolvedValue(null);
    expect((await POST(request({ ventureId: 'v1', save: true }))).status).toBe(401);
    expect(mockedSet).not.toHaveBeenCalled();
  });

  it('validates the payload', async () => {
    expect((await POST(request({ ventureId: 'v1', save: 'yes' }))).status).toBe(400);
    expect(mockedSet).not.toHaveBeenCalled();
  });

  it('saves an item for the signed-in account', async () => {
    const response = await POST(request({ ventureId: 'vtr-1', save: true }));
    expect(response.status).toBe(200);
    expect(mockedSet).toHaveBeenCalledWith('acc-1', 'tenant-001', 'vtr-1', true);
    expect((await response.json()).data.saved).toBe(true);
  });

  it('returns 404 when the venture is outside the tenant', async () => {
    mockedSet.mockResolvedValue(false);
    expect((await POST(request({ ventureId: 'foreign', save: true }))).status).toBe(404);
  });
});
