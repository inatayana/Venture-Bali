/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { issueCustomerSession } from '@/lib/customerGuard';

jest.mock('@/lib/rateLimit.distributed', () => ({
  rateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 5, retryAfterSeconds: 0 }),
  clientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

jest.mock('@/lib/customerGuard', () => ({
  issueCustomerSession: jest.fn().mockResolvedValue('cs1.opaque-session.signature'),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customerAccount: { findUnique: jest.fn(), update: jest.fn() },
    authToken: { findFirst: jest.fn(), updateMany: jest.fn() },
  },
}));

const mockedAccount = prisma.customerAccount.findUnique as jest.Mock;
const mockedUpdateAccount = prisma.customerAccount.update as jest.Mock;
const mockedFindToken = prisma.authToken.findFirst as jest.Mock;
const mockedClaim = prisma.authToken.updateMany as jest.Mock;
const mockedIssue = issueCustomerSession as jest.Mock;

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/account/otp/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const pendingAccount = {
  id: 'acc-1',
  email: 'guest@example.com',
  status: 'PENDING',
  emailVerifiedAt: null,
  lockedUntil: null,
  customer: { id: 'customer-1', name: 'Guest' },
};

describe('POST /api/account/otp/verify', () => {
  const originalSecret = process.env.CUSTOMER_SESSION_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CUSTOMER_SESSION_SECRET = 'test-customer-session-secret-32-chars';
    mockedAccount.mockResolvedValue(pendingAccount);
    mockedUpdateAccount.mockResolvedValue({ failedLoginCount: 1 });
    mockedIssue.mockResolvedValue('cs1.opaque-session.signature');
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.CUSTOMER_SESSION_SECRET;
    else process.env.CUSTOMER_SESSION_SECRET = originalSecret;
  });

  it('rejects malformed input before touching the database', async () => {
    const response = await POST(request({ email: 'not-an-email', code: '123' }));
    expect(response.status).toBe(400);
    expect(mockedAccount).not.toHaveBeenCalled();
  });

  it('returns a generic error and records a failure for an unknown code', async () => {
    mockedFindToken.mockResolvedValue(null);

    const response = await POST(request({ email: 'guest@example.com', code: '000000' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('INVALID_OR_EXPIRED_CODE');
    expect(mockedUpdateAccount).toHaveBeenCalled();
    expect(mockedIssue).not.toHaveBeenCalled();
  });

  it('activates the account and sets an opaque session cookie', async () => {
    mockedFindToken.mockResolvedValue({ id: 'token-1' });
    mockedClaim.mockResolvedValue({ count: 1 });

    const response = await POST(request({ email: 'GUEST@example.com', code: '123456' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ACTIVE');
    expect(mockedIssue).toHaveBeenCalledWith('acc-1');
    expect(response.headers.get('set-cookie')).toContain('bw_customer=');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
  });

  it('does not issue a session when another request consumed the code first', async () => {
    mockedFindToken.mockResolvedValue({ id: 'token-1' });
    mockedClaim.mockResolvedValue({ count: 0 });

    const response = await POST(request({ email: 'guest@example.com', code: '123456' }));

    expect(response.status).toBe(401);
    expect(mockedIssue).not.toHaveBeenCalled();
  });

  it('blocks a suspended account with the same generic error', async () => {
    mockedAccount.mockResolvedValue({ ...pendingAccount, status: 'SUSPENDED' });

    const response = await POST(request({ email: 'guest@example.com', code: '123456' }));

    expect(response.status).toBe(401);
    expect(mockedFindToken).not.toHaveBeenCalled();
  });
});
