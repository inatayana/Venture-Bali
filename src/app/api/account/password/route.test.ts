/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE, POST } from './route';
import { requireCustomer, revokeOtherCustomerSessions } from '@/lib/customerGuard';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/rateLimit.distributed', () => ({
  rateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 5, retryAfterSeconds: 0 }),
  clientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

jest.mock('@/lib/customerGuard', () => ({
  requireCustomer: jest.fn(),
  revokeOtherCustomerSessions: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customerAccount: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

const mockedRequire = requireCustomer as jest.Mock;
const mockedRevoke = revokeOtherCustomerSessions as jest.Mock;
const mockedFind = prisma.customerAccount.findUnique as jest.Mock;
const mockedUpdate = prisma.customerAccount.update as jest.Mock;

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
  hasPassword: false,
};

function request(body: unknown, method = 'POST'): NextRequest {
  return new NextRequest('http://localhost/api/account/password', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/account/password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequire.mockResolvedValue(user);
    mockedFind.mockResolvedValue({ passwordHash: null });
    mockedUpdate.mockResolvedValue({});
  });

  it('rejects guests', async () => {
    mockedRequire.mockResolvedValue(null);
    expect((await POST(request({ newPassword: 'GoodPassword123' }))).status).toBe(401);
    expect((await DELETE(request({ currentPassword: 'whatever' }, 'DELETE'))).status).toBe(401);
  });

  it('rejects weak passwords before writing', async () => {
    const response = await POST(request({ newPassword: 'password123' }));
    expect(response.status).toBe(400);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('stores only a hash and revokes other sessions on first setup', async () => {
    const response = await POST(request({ newPassword: 'GoodPassword123' }));

    expect(response.status).toBe(200);
    const data = mockedUpdate.mock.calls[0][0].data;
    expect(data.passwordHash).toMatch(/^scrypt\$131072\$8\$1\$/);
    expect(data.passwordHash).not.toContain('GoodPassword123');
    expect(mockedRevoke).toHaveBeenCalledWith('acc-1');
  });

  it('requires the current password when changing an existing one', async () => {
    mockedFind.mockResolvedValue({ passwordHash: 'scrypt$00$00' });

    const bad = await POST(request({ newPassword: 'AnotherGood123', currentPassword: 'wrong' }));
    expect(bad.status).toBe(401);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('removes the password and revokes other sessions', async () => {
    const { hashPassword } = await import('@/lib/customerAuth');
    mockedFind.mockResolvedValue({ passwordHash: hashPassword('GoodPassword123') });

    const response = await DELETE(request({ currentPassword: 'GoodPassword123' }, 'DELETE'));

    expect(response.status).toBe(200);
    expect(mockedUpdate.mock.calls[0][0].data.passwordHash).toBeNull();
    expect(mockedRevoke).toHaveBeenCalledWith('acc-1');
  });
});
