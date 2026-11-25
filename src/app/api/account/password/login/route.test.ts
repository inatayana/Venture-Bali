/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';
import { issueCustomerSession } from '@/lib/customerGuard';
import { hashPassword } from '@/lib/customerAuth';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/rateLimit.distributed', () => ({
  rateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 5, retryAfterSeconds: 0 }),
  clientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

jest.mock('@/lib/customerGuard', () => ({
  issueCustomerSession: jest.fn().mockResolvedValue('cs1.signed.token'),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customerAccount: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

const mockedFind = prisma.customerAccount.findUnique as jest.Mock;
const mockedUpdate = prisma.customerAccount.update as jest.Mock;
const mockedIssue = issueCustomerSession as jest.Mock;

const account = {
  id: 'acc-1',
  email: 'guest@example.com',
  status: 'ACTIVE',
  passwordHash: hashPassword('GoodPassword123'),
  lockedUntil: null,
  customer: { id: 'customer-1', name: 'Guest' },
};

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/account/password/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/account/password/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFind.mockResolvedValue(account);
    mockedUpdate.mockResolvedValue({ failedLoginCount: 0 });
    mockedIssue.mockResolvedValue('cs1.signed.token');
  });

  it('rejects malformed input', async () => {
    expect((await POST(request({ email: 'bad', password: '' }))).status).toBe(400);
    expect(mockedFind).not.toHaveBeenCalled();
  });

  it('returns the same generic error for a wrong password', async () => {
    const response = await POST(request({ email: 'guest@example.com', password: 'WrongPassword1' }));
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe('INVALID_CREDENTIALS');
    expect(mockedIssue).not.toHaveBeenCalled();
  });

  it('does not reveal whether an account has a password', async () => {
    mockedFind.mockResolvedValue({ ...account, passwordHash: null });
    const response = await POST(request({ email: 'guest@example.com', password: 'GoodPassword123' }));
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe('INVALID_CREDENTIALS');
  });

  it('issues a session cookie on success', async () => {
    const response = await POST(request({ email: 'GUEST@example.com', password: 'GoodPassword123' }));

    expect(response.status).toBe(200);
    expect(mockedIssue).toHaveBeenCalledWith('acc-1');
    expect(response.headers.get('set-cookie')).toContain('bw_customer=');
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ failedLoginCount: 0 }) }),
    );
  });
});
