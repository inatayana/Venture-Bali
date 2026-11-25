import { issueAccountOtp, sendAccountActivationOtp } from './accountActivation';
import { prisma } from '@/lib/prisma';
import { sendAccountOtpEmail } from './accountEmail';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    authToken: {
      updateMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    booking: { findUnique: jest.fn() },
  },
}));

jest.mock('./accountEmail', () => ({
  sendAccountOtpEmail: jest.fn().mockResolvedValue(true),
}));

const mockedTransaction = prisma.$transaction as jest.Mock;
const mockedInvalidate = prisma.authToken.updateMany as jest.Mock;
const mockedCreate = prisma.authToken.create as jest.Mock;
const mockedFindToken = prisma.authToken.findFirst as jest.Mock;
const mockedFindBooking = prisma.booking.findUnique as jest.Mock;
const mockedSend = sendAccountOtpEmail as jest.Mock;

describe('account activation', () => {
  const originalSecret = process.env.CUSTOMER_SESSION_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CUSTOMER_SESSION_SECRET = 'test-customer-session-secret-32-chars';
    mockedTransaction.mockImplementation(async (operations: unknown[]) => Promise.all(operations));
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.CUSTOMER_SESSION_SECRET;
    else process.env.CUSTOMER_SESSION_SECRET = originalSecret;
  });

  it('invalidates earlier codes, stores only a hash and emails a new code', async () => {
    const sent = await issueAccountOtp({
      accountId: 'acc-1',
      email: 'guest@example.com',
      purpose: 'ACTIVATE',
    });

    expect(sent).toBe(true);
    expect(mockedInvalidate).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ accountId: 'acc-1' }) }),
    );
    const created = mockedCreate.mock.calls[0][0].data;
    expect(created.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(created.tokenHash).not.toMatch(/^\d{6}$/);
    expect(mockedSend).toHaveBeenCalledWith('guest@example.com', expect.stringMatching(/^\d{6}$/), 'ACTIVATE');
  });

  it('fails closed without a secret and performs no writes', async () => {
    delete process.env.CUSTOMER_SESSION_SECRET;

    const sent = await issueAccountOtp({
      accountId: 'acc-1',
      email: 'guest@example.com',
      purpose: 'SIGN_IN',
    });

    expect(sent).toBe(false);
    expect(mockedTransaction).not.toHaveBeenCalled();
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('skips activation when the account is already active', async () => {
    mockedFindBooking.mockResolvedValue({
      customer: { account: { id: 'acc-1', email: 'guest@example.com', status: 'ACTIVE' } },
    });

    await sendAccountActivationOtp('booking-1');

    expect(mockedFindToken).not.toHaveBeenCalled();
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('sends once for a pending account and deduplicates webhook retries', async () => {
    mockedFindBooking.mockResolvedValue({
      customer: { account: { id: 'acc-1', email: 'guest@example.com', status: 'PENDING' } },
    });
    mockedFindToken.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'token-1' });

    await sendAccountActivationOtp('booking-1');
    await sendAccountActivationOtp('booking-1');

    expect(mockedSend).toHaveBeenCalledTimes(1);
  });
});
