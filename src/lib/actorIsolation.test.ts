/**
 * @jest-environment node
 */
import { requireAdminRole } from './adminGuard';
import { requireCustomer } from './customerGuard';
import { requireFieldOps } from './opsGuard';
import { createCustomerSessionToken } from './customerSession';
import { createOpsSessionToken } from './opsSession';
import { createSessionToken } from './adminSession';

const mockCookieJar = new Map<string, string>();

jest.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      mockCookieJar.has(name) ? { name, value: mockCookieJar.get(name) as string } : undefined,
  }),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    customerSession: { findUnique: jest.fn().mockResolvedValue(null) },
    fieldOpsSession: { findUnique: jest.fn().mockResolvedValue(null) },
  },
}));

describe('four-actor session isolation', () => {
  beforeAll(() => {
    process.env.CUSTOMER_SESSION_SECRET = 'customer-secret-at-least-16-chars';
    process.env.OPS_SESSION_SECRET = 'ops-secret-at-least-16-chars';
    process.env.ADMIN_SESSION_SECRET = 'admin-secret-at-least-16-chars';
  });

  beforeEach(() => mockCookieJar.clear());

  it('an ops cookie never authenticates a customer or admin', async () => {
    mockCookieJar.set('vb_ops_session', await createOpsSessionToken('a'.repeat(43)));

    expect(await requireCustomer()).toBeNull();
    expect(await requireAdminRole()).toBeNull();
  });

  it('a customer cookie never authenticates Field Ops', async () => {
    mockCookieJar.set('bw_customer', await createCustomerSessionToken('b'.repeat(43)));

    expect(await requireFieldOps()).toBeNull();
    expect(await requireAdminRole()).toBeNull();
  });

  it('an admin cookie never authenticates a customer or Field Ops', async () => {
    const token = await createSessionToken({
      adminId: 'admin-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    mockCookieJar.set('vb_admin_session', token);

    expect(await requireCustomer()).toBeNull();
    expect(await requireFieldOps()).toBeNull();
  });
});
