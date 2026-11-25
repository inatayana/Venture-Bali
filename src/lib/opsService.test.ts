import { prisma } from '@/lib/prisma';
import { applyCheckIn, listManifest, OpsServiceError } from './opsService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    booking: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    bookingParticipant: { updateMany: jest.fn() },
    voucher: { updateMany: jest.fn() },
  },
}));

const mockedTransaction = prisma.$transaction as jest.Mock;
const mockedFindFirst = prisma.booking.findFirst as jest.Mock;
const mockedFindUnique = prisma.booking.findUnique as jest.Mock;
const mockedFindMany = prisma.booking.findMany as jest.Mock;
const mockedUpdate = prisma.booking.update as jest.Mock;
const mockedParticipant = prisma.bookingParticipant.updateMany as jest.Mock;
const mockedVoucher = prisma.voucher.updateMany as jest.Mock;

const user = {
  id: 'ops-1',
  name: 'Driver One',
  email: 'driver@example.com',
  role: 'DRIVER' as const,
  tenantId: 'tenant-001',
};

function booking(status: string, fieldOpsUserId: string | null = null) {
  return {
    id: 'booking-1',
    bookingCode: 'BW-2026-0001',
    customerId: 'customer-1',
    lifecycleStatus: status,
    fieldOpsUserId,
    paymentStatus: 'PAID',
    cancelledAt: null,
  };
}

const detail = {
  ...booking('CHECKED_IN'),
  customer: { name: 'Guest One' },
  slotTime: { time: '08:00' },
  pickupZone: { name: 'Zone 1' },
  variant: { venture: { title: 'Sunrise Trek' } },
  participants: [],
};

describe('opsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ booking: { update: mockedUpdate }, bookingParticipant: { updateMany: mockedParticipant }, voucher: { updateMany: mockedVoucher } }),
    );
    mockedFindFirst.mockResolvedValue(booking('CONFIRMED'));
    mockedFindUnique.mockResolvedValue(detail);
    mockedUpdate.mockResolvedValue({});
    mockedParticipant.mockResolvedValue({ count: 1 });
    mockedVoucher.mockResolvedValue({ count: 1 });
  });

  it('checks in and redeems the voucher once (idempotent on repeat)', async () => {
    const first = await applyCheckIn({ user, bookingId: 'booking-1', action: 'CHECKED_IN' });
    expect(first.lifecycleStatus).toBe('CHECKED_IN');
    expect(mockedVoucher).toHaveBeenCalledTimes(1);

    mockedFindFirst.mockResolvedValue(booking('CHECKED_IN'));
    const second = await applyCheckIn({ user, bookingId: 'booking-1', action: 'CHECKED_IN' });
    expect(second.lifecycleStatus).toBe('CHECKED_IN');
    expect(mockedVoucher).toHaveBeenCalledTimes(1); // no second redemption
  });

  it('rejects an invalid no-show transition', async () => {
    mockedFindFirst.mockResolvedValue(booking('COMPLETED'));
    await expect(applyCheckIn({ user, bookingId: 'booking-1', action: 'NO_SHOW' })).rejects.toThrow(OpsServiceError);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('blocks a booking assigned to another staff member', async () => {
    mockedFindFirst.mockResolvedValue(booking('CONFIRMED', 'ops-2'));
    await expect(applyCheckIn({ user, bookingId: 'booking-1', action: 'CHECKED_IN' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('returns an allowlisted manifest with no supplier or payment fields', async () => {
    mockedFindMany.mockResolvedValue([detail]);
    const rows = await listManifest(user, '2026-11-25');

    expect(mockedFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-001', fieldOpsUserId: 'ops-1' }) }));
    expect(rows[0]).toMatchObject({ bookingCode: 'BW-2026-0001', guestName: 'Guest One' });
    const json = JSON.stringify(rows);
    expect(json).not.toMatch(/vendor|commission|payout|grossAmount|fixedFeePerPax|revenueSharePct/i);
  });
});
