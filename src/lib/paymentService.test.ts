import { processMidtransWebhook, PaymentServiceError } from '@/lib/paymentService';
import { prisma } from '@/lib/prisma';
import type { Payment, Booking } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    payment: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/midtrans', () => ({
  ...jest.requireActual('@/lib/midtrans'),
  verifyWebhookSignature: jest.fn(),
  mapTransactionStatus: jest.requireActual('@/lib/midtrans').mapTransactionStatus,
}));

import { verifyWebhookSignature } from '@/lib/midtrans';

const mockedFindFirst = prisma.payment.findFirst as jest.Mock;
const mockedTransaction = prisma.$transaction as jest.Mock;
const mockedVerify = verifyWebhookSignature as unknown as jest.Mock;

const SERVER_KEY_PLACEHOLDER = 'unused';

const booking: Booking = {
  id: 'booking-001',
  bookingCode: 'BK-TEST-001',
  variantId: 'var-001',
  customerId: 'customer-001',
  bookingDate: '2026-09-10',
  slotTimeId: 'slot-001',
  fulfillmentMode: 'SELF_DRIVE',
  pickupZoneId: null,
  vehicleClassId: null,
  hotelAddress: null,
  isTba: false,
  paxCount: 2,
  vehicleCount: 1,
  zoneSurchargeIdr: 0,
  nightSurchargeIdr: 0,
  discountIdr: 0,
  appliedCouponCode: null,
  selectedAddons: [],
  totalPrice: 836000,
  paymentStatus: 'PENDING',
  lifecycleStatus: 'AWAITING_PAYMENT',
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const payment: Payment & { booking: Booking } = {
  id: 'payment-001',
  bookingId: 'booking-001',
  midtransOrderId: 'BK-TEST-001',
  snapToken: 'snap-token',
  redirectUrl: 'https://app.sandbox.midtrans.com/snap/v2/pay',
  paymentMethod: null,
  grossAmount: 836000,
  transactionTime: null,
  rawResponse: null,
  status: 'PENDING',
  createdAt: new Date(),
  updatedAt: new Date(),
  booking,
};

function makePayload(overrides: Record<string, unknown> = {}) {
  const base = {
    order_id: 'BK-TEST-001',
    status_code: '200',
    status_message: 'Success',
    transaction_status: 'settlement',
    payment_type: 'qris',
    gross_amount: '836000.00',
    transaction_time: '2026-09-09 12:00:00',
    transaction_id: 'txn-001',
    merchant_id: 'merchant-001',
    signature_key: 'valid-signature',
  };
  return { ...base, ...overrides };
}

describe('processMidtransWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MIDTRANS_SERVER_KEY = SERVER_KEY_PLACEHOLDER;
  });

  it('rejects invalid signature', async () => {
    mockedVerify.mockResolvedValue(false);
    await expect(processMidtransWebhook(makePayload())).rejects.toThrow(PaymentServiceError);
    await expect(processMidtransWebhook(makePayload())).rejects.toMatchObject({ code: 'INVALID_SIGNATURE' });
  });

  it('rejects unknown order id', async () => {
    mockedVerify.mockResolvedValue(true);
    mockedFindFirst.mockResolvedValue(null);
    await expect(processMidtransWebhook(makePayload())).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('rejects gross amount mismatch', async () => {
    mockedVerify.mockResolvedValue(true);
    mockedFindFirst.mockResolvedValue(payment);
    await expect(
      processMidtransWebhook(makePayload({ gross_amount: '999999.00' })),
    ).rejects.toMatchObject({ code: 'AMOUNT_MISMATCH' });
  });

  it('is idempotent when payment already PAID', async () => {
    mockedVerify.mockResolvedValue(true);
    mockedFindFirst.mockResolvedValue({ ...payment, status: 'PAID' as const });
    const result = await processMidtransWebhook(makePayload());
    expect(result).toEqual({ paymentStatus: 'PAID', voucherIssued: false });
    expect(mockedTransaction).not.toHaveBeenCalled();
  });

  it('updates payment, booking, and issues voucher on PAID', async () => {
    mockedVerify.mockResolvedValue(true);
    mockedFindFirst.mockResolvedValue(payment);

    const tx = {
      payment: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      booking: {
        update: jest.fn().mockResolvedValue(booking),
      },
      voucher: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'voucher-001' }),
      },
    };
    mockedTransaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));

    const result = await processMidtransWebhook(makePayload());

    expect(result).toEqual({ paymentStatus: 'PAID', voucherIssued: true });
    expect(tx.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment-001', status: 'PENDING' },
        data: expect.objectContaining({ status: 'PAID', paymentMethod: 'qris' }),
      }),
    );
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-001' },
      data: { paymentStatus: 'PAID', lifecycleStatus: 'CONFIRMED', expiresAt: null },
    });
    expect(tx.voucher.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ bookingId: 'booking-001', status: 'ACTIVE' }),
    });
  });

  it('does not issue voucher on CANCELLED status', async () => {
    mockedVerify.mockResolvedValue(true);
    mockedFindFirst.mockResolvedValue(payment);

    const tx = {
      payment: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      booking: {
        update: jest.fn().mockResolvedValue(booking),
      },
      voucher: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    mockedTransaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));

    const result = await processMidtransWebhook(makePayload({ transaction_status: 'expire' }));

    expect(result).toEqual({ paymentStatus: 'CANCELLED', voucherIssued: false });
    expect(tx.voucher.create).not.toHaveBeenCalled();
  });

  it('skips update when concurrent webhook already processed (updateMany returns 0)', async () => {
    mockedVerify.mockResolvedValue(true);
    mockedFindFirst.mockResolvedValue(payment);

    const tx = {
      payment: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      booking: {
        update: jest.fn(),
      },
      voucher: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    mockedTransaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));

    const result = await processMidtransWebhook(makePayload());

    expect(result.voucherIssued).toBe(false);
    expect(tx.booking.update).not.toHaveBeenCalled();
  });
});
