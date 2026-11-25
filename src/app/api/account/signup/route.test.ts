/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { issueAccountOtp } from '@/lib/accountActivation';

jest.mock('@/lib/rateLimit.distributed', () => ({
  rateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 5, retryAfterSeconds: 0 }),
  clientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

jest.mock('@/lib/tenant/context', () => ({
  getTenantContext: jest.fn().mockResolvedValue({ id: 'tenant-001' }),
}));

jest.mock('@/lib/accountActivation', () => ({
  issueAccountOtp: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { upsert: jest.fn() },
    customerAccount: { upsert: jest.fn() },
  },
}));

const mockedCustomer = prisma.customer.upsert as jest.Mock;
const mockedAccount = prisma.customerAccount.upsert as jest.Mock;
const mockedOtp = issueAccountOtp as jest.Mock;

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/account/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: 'New Guest',
  email: 'New.Guest@Example.com',
  whatsapp: '6281234567890',
  countryCode: 'ID',
};

describe('POST /api/account/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCustomer.mockResolvedValue({ id: 'customer-1' });
    mockedAccount.mockResolvedValue({ id: 'acc-1', email: 'new.guest@example.com', status: 'PENDING' });
  });

  it('rejects invalid input before touching the database', async () => {
    const response = await POST(request({ ...validBody, email: 'bad' }));
    expect(response.status).toBe(400);
    expect(mockedCustomer).not.toHaveBeenCalled();
  });

  it('creates a PENDING account and emails an activation code', async () => {
    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect(mockedCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'new.guest@example.com' } }),
    );
    expect(mockedAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ tenantId: 'tenant-001', status: 'PENDING' }),
      }),
    );
    expect(mockedOtp).toHaveBeenCalledWith({
      accountId: 'acc-1',
      email: 'new.guest@example.com',
      purpose: 'ACTIVATE',
    });
  });

  it('issues a sign-in code when the account already exists and is active', async () => {
    mockedAccount.mockResolvedValue({ id: 'acc-1', email: 'new.guest@example.com', status: 'ACTIVE' });

    await POST(request(validBody));

    expect(mockedOtp).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'SIGN_IN' }));
  });

  it('returns a generic response when the database is unavailable', async () => {
    mockedCustomer.mockRejectedValue(new Error('db down'));

    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect((await response.json()).data.sent).toBe(true);
    expect(mockedOtp).not.toHaveBeenCalled();
  });
});
