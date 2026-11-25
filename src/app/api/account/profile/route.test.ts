/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PATCH } from './route';
import { requireCustomer } from '@/lib/customerGuard';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/customerGuard', () => ({
  requireCustomer: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: { customer: { update: jest.fn() } },
}));

const mockedRequire = requireCustomer as jest.Mock;
const mockedUpdate = prisma.customer.update as jest.Mock;

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/account/profile', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const user = {
  accountId: 'acc-1',
  customerId: 'customer-1',
  name: 'Guest',
  email: 'guest@example.com',
  tenantId: 'tenant-001',
  status: 'ACTIVE' as const,
};

describe('PATCH /api/account/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequire.mockResolvedValue(user);
    mockedUpdate.mockResolvedValue({ name: 'Updated Guest', whatsapp: '6281234567890', countryCode: 'ID' });
  });

  it('rejects anonymous requests', async () => {
    mockedRequire.mockResolvedValue(null);

    const response = await PATCH(request({ name: 'Updated Guest' }));

    expect(response.status).toBe(401);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('rejects an empty patch and invalid values', async () => {
    expect((await PATCH(request({}))).status).toBe(400);
    expect((await PATCH(request({ name: 'X', countryCode: 'ID' }))).status).toBe(400);
    expect((await PATCH(request({ countryCode: 'invalid' }))).status).toBe(400);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('updates only editable fields and ignores email', async () => {
    const response = await PATCH(
      request({ name: 'Updated Guest', whatsapp: '6281234567890', email: 'hacker@example.com' }),
    );

    expect(response.status).toBe(200);
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 'customer-1' },
      data: { name: 'Updated Guest', whatsapp: '6281234567890' },
      select: { name: true, whatsapp: true, countryCode: true },
    });
    expect((await response.json()).data.name).toBe('Updated Guest');
  });
});
