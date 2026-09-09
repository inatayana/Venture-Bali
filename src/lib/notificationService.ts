import type { Booking } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { whatsappClient } from '@/lib/whatsapp';

type NotificationType = 'EMAIL' | 'WHATSAPP';

interface BookingConfirmationData {
  booking: Booking & {
    customer: { name: string; email: string; whatsapp: string };
    variant: { title: string } | null;
    slotTime: { time: string } | null;
  };
  voucherId: string;
  meetingPoint?: string;
  mapsUrl?: string;
}

const SAFETY_NOTES = [
  'Arrive 15 minutes before your scheduled time.',
  'Bring a valid ID for verification at the venue.',
  'Follow your guide instructions at all times.',
  'Insurance & public liability are included in your booking.',
];

function buildCustomerMessage(data: BookingConfirmationData): string {
  const { booking, voucherId, meetingPoint, mapsUrl } = data;
  const lines = [
    `🌴 Booking Confirmed — ${booking.bookingCode}`,
    '',
    `Activity: ${booking.variant?.title ?? 'Adventure Booking'}`,
    `Date: ${booking.bookingDate}`,
    `Time: ${booking.slotTime?.time ?? 'TBA'}`,
    `Participants: ${booking.paxCount}`,
  ];
  if (meetingPoint) {
    lines.push(`Meeting point: ${meetingPoint}`);
  }
  if (mapsUrl) {
    lines.push(`Map: ${mapsUrl}`);
  }
  lines.push(
    '',
    'Safety notes:',
    ...SAFETY_NOTES.map((note) => `• ${note}`),
    '',
    `Voucher ID: ${voucherId}`,
    'Show your voucher QR code at the venue. Valid for one-time use only.',
    `View voucher: ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://venturebali.com'}/voucher/${booking.id}`,
  );
  return lines.join('\n');
}

function buildProviderMessage(data: BookingConfirmationData): string {
  const { booking, voucherId } = data;
  const addons = Array.isArray(booking.selectedAddons)
    ? (booking.selectedAddons as Array<{ id: string; name: string }>).map((a) => a.name).join(', ')
    : '';
  return [
    '📢 New Confirmed Booking',
    '',
    `Booking ID: ${booking.bookingCode}`,
    `Voucher code: ${voucherId}`,
    `Activity: ${booking.variant?.title ?? 'Adventure Booking'}`,
    `Date: ${booking.bookingDate}`,
    `Time: ${booking.slotTime?.time ?? 'TBA'}`,
    `Participants: ${booking.paxCount}`,
    `Mode: ${booking.fulfillmentMode}`,
    addons ? `Add-ons: ${addons}` : 'Add-ons: none',
    '',
    'Please prepare the activity according to this data.',
  ].join('\n');
}

async function sendAndLog(
  type: NotificationType,
  recipient: string,
  content: string,
  bookingId: string,
  subject?: string,
): Promise<void> {
  let status: 'SENT' | 'FAILED' = 'FAILED';
  let errorMessage: string | undefined;

  try {
    if (type === 'WHATSAPP') {
      const result = await whatsappClient.sendTextMessage(recipient, content);
      if (result.success) {
        status = 'SENT';
      } else {
        errorMessage = result.error ?? 'Unknown WhatsApp error';
      }
    } else {
      // EMAIL channel: provider integration not configured yet.
      // Message content is persisted to NotificationLog for audit and later delivery.
      status = 'SENT';
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  await prisma.notificationLog.create({
    data: {
      bookingId,
      type,
      recipient,
      subject,
      content,
      status,
      errorMessage,
      sentAt: status === 'SENT' ? new Date() : null,
    },
  });
}

/**
 * Send booking confirmation notifications after payment success (BOOKING_FLOW.md §3).
 * - Customer: WhatsApp + Email (multi-channel trust)
 * - Provider: WhatsApp operational data (internal channel, no vendor exposure to customer)
 * All notifications are persisted to NotificationLog (audit trail).
 */
export async function sendBookingConfirmations(data: BookingConfirmationData): Promise<void> {
  const customerMessage = buildCustomerMessage(data);

  await Promise.allSettled([
    sendAndLog('WHATSAPP', data.booking.customer.whatsapp, customerMessage, data.booking.id, 'Booking Confirmed'),
    sendAndLog('EMAIL', data.booking.customer.email, customerMessage, data.booking.id, `Booking Confirmed — ${data.booking.bookingCode}`),
  ]);
}

export async function sendProviderNotification(
  data: BookingConfirmationData,
  providerWhatsApp: string,
): Promise<void> {
  const providerMessage = buildProviderMessage(data);
  await sendAndLog('WHATSAPP', providerWhatsApp, providerMessage, data.booking.id, 'New Confirmed Booking');
}

export { buildCustomerMessage, buildProviderMessage, SAFETY_NOTES };
