import {
  buildCustomerMessage,
  buildProviderMessage,
  SAFETY_NOTES,
  sendBookingConfirmations,
} from '@/lib/notificationService';
import { prisma } from '@/lib/prisma';
import { whatsappClient } from '@/lib/whatsapp';
import type { Booking } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    notificationLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/whatsapp', () => ({
  whatsappClient: {
    sendTextMessage: jest.fn(),
  },
}));

const mockedLogCreate = prisma.notificationLog.create as jest.Mock;
const mockedSendWhatsApp = whatsappClient.sendTextMessage as jest.Mock;

type BookingWithRelations = Booking & {
  customer: { name: string; email: string; whatsapp: string };
  variant: { title: string } | null;
  slotTime: { time: string } | null;
};

const booking: BookingWithRelations = {
  id: 'booking-001',
  bookingCode: 'BK-TEST-001',
  variantId: 'var-001',
  customerId: 'cust-001',
  bookingDate: '2026-09-10',
  slotTimeId: 'slot-001',
  fulfillmentMode: 'SELF_DRIVE',
  pickupZoneId: null,
  vehicleClassId: null,
  hotelAddress: null,
  paxCount: 2,
  vehicleCount: 1,
  zoneSurchargeIdr: 0,
  selectedAddons: [{ id: 'addon-001', name: 'Professional Photographer' }],
  totalPrice: 836000,
  paymentStatus: 'PAID',
  createdAt: new Date(),
  updatedAt: new Date(),
  customer: { name: 'Test Customer', email: 'customer@example.com', whatsapp: '+6281234567890' },
  variant: { title: 'ATV Adventure in Ubud Jungle' },
  slotTime: { time: '08:00 AM' },
};

const confirmationData = {
  booking,
  voucherId: 'VR-TEST-001',
  meetingPoint: 'Tegallalang, Ubud, Gianyar',
};

describe('buildCustomerMessage', () => {
  it('includes activity details, voucher, and safety notes', () => {
    const message = buildCustomerMessage(confirmationData);
    expect(message).toContain('BK-TEST-001');
    expect(message).toContain('ATV Adventure in Ubud Jungle');
    expect(message).toContain('2026-09-10');
    expect(message).toContain('08:00 AM');
    expect(message).toContain('Participants: 2');
    expect(message).toContain('Tegallalang, Ubud, Gianyar');
    expect(message).toContain('VR-TEST-001');
    expect(message).toContain('one-time use only');
  });

  it('mentions insurance included', () => {
    const message = buildCustomerMessage(confirmationData);
    expect(message).toContain('Insurance & public liability are included');
  });

  it('omits meeting point section when not provided', () => {
    const message = buildCustomerMessage({ booking, voucherId: 'VR-TEST-001' });
    expect(message).not.toContain('Meeting point');
  });
});

describe('buildProviderMessage', () => {
  it('includes operational data: booking id, voucher, pax, add-ons', () => {
    const message = buildProviderMessage(confirmationData);
    expect(message).toContain('BK-TEST-001');
    expect(message).toContain('VR-TEST-001');
    expect(message).toContain('Participants: 2');
    expect(message).toContain('Professional Photographer');
    expect(message).toContain('SELF_DRIVE');
  });
});

describe('SAFETY_NOTES', () => {
  it('always mentions insurance (product rule)', () => {
    expect(SAFETY_NOTES.some((note) => note.toLowerCase().includes('insurance'))).toBe(true);
  });
});

describe('sendBookingConfirmations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends WhatsApp + Email and logs both channels', async () => {
    mockedSendWhatsApp.mockResolvedValue({ success: true, messageId: 'wa-001' });

    await sendBookingConfirmations(confirmationData);

    expect(mockedSendWhatsApp).toHaveBeenCalledWith('+6281234567890', expect.stringContaining('BK-TEST-001'));
    expect(mockedLogCreate).toHaveBeenCalledTimes(2);

    const whatsappLog = mockedLogCreate.mock.calls.find(
      (call) => call[0].data.type === 'WHATSAPP',
    );
    const emailLog = mockedLogCreate.mock.calls.find(
      (call) => call[0].data.type === 'EMAIL',
    );
    expect(whatsappLog[0].data.recipient).toBe('+6281234567890');
    expect(whatsappLog[0].data.status).toBe('SENT');
    expect(emailLog[0].data.recipient).toBe('customer@example.com');
    expect(emailLog[0].data.bookingId).toBe('booking-001');
  });

  it('logs FAILED status when WhatsApp send fails but does not throw', async () => {
    mockedSendWhatsApp.mockResolvedValue({ success: false, error: 'Token not configured' });

    await expect(sendBookingConfirmations(confirmationData)).resolves.toBeUndefined();

    const whatsappLog = mockedLogCreate.mock.calls.find(
      (call) => call[0].data.type === 'WHATSAPP',
    );
    expect(whatsappLog[0].data.status).toBe('FAILED');
    expect(whatsappLog[0].data.errorMessage).toBe('Token not configured');
  });
});
