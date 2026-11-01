/**
 * Venture Bali — booking notifications
 * -------------------------------------
 * One module owns every outbound customer message so the booking flow, the
 * cron reminders and (later) the WhatsApp agent all use the same templates.
 *
 * Channels
 * - WHATSAPP: existing WhatsApp Cloud API client.
 * - EMAIL: Resend HTTP API via `fetch` — no SDK dependency.
 *
 * Every attempt is written to `NotificationLog`, whether it succeeded or not.
 * Nothing here ever throws to the caller: a failed notification must never
 * break a payment webhook or a cron run.
 */

import { prisma } from '@/lib/prisma';
import { whatsappClient } from '@/lib/whatsapp';
import { getBaseUrl } from '@/lib/seo';
import { buildCustomerBookingsUrl, createCustomerLinkToken } from '@/lib/customerLink';

export type NotificationChannel = 'WHATSAPP' | 'EMAIL';

export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
}

const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

interface BookingForNotification {
  id: string;
  bookingCode: string;
  bookingDate: string;
  paxCount: number;
  totalPrice: number;
  fulfillmentMode: string;
  hotelAddress: string | null;
  isTba: boolean;
  customer: { id: string; name: string; email: string; whatsapp: string };
  variant: { title: string };
  slotTime: { time: string } | null;
}

/** Calendar date key in WITA (UTC+8), optionally shifted by whole days. */
export function getWitaDateKey(date: Date = new Date(), daysAhead = 0): string {
  const shifted = new Date(date.getTime() + WITA_OFFSET_MS + daysAhead * 24 * 60 * 60 * 1000);
  return shifted.toISOString().split('T')[0];
}

function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatLongDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function voucherUrl(bookingCode: string): string {
  return `${getBaseUrl()}/voucher/verify/${encodeURIComponent(bookingCode)}`;
}

function pickupLine(booking: BookingForNotification): string {
  if (booking.fulfillmentMode === 'SELF_DRIVE') {
    return 'Meeting point: make your own way to the activity location.';
  }
  if (booking.isTba) {
    return 'Pickup: hotel address to be confirmed by H-1.';
  }
  return `Pickup: ${booking.hotelAddress ?? 'your hotel lobby'}.`;
}

export function buildConfirmationText(booking: BookingForNotification): string {
  const manageUrl = buildCustomerBookingsUrl(booking.customer.id);

  return [
    `Booking confirmed — ${booking.variant.title}`,
    `Code: ${booking.bookingCode}`,
    `Date: ${formatLongDate(booking.bookingDate)}${booking.slotTime ? ` at ${booking.slotTime.time}` : ''}`,
    `Guests: ${booking.paxCount}`,
    `Total paid: ${formatIdr(booking.totalPrice)}`,
    pickupLine(booking),
    '',
    `Voucher & QR: ${voucherUrl(booking.bookingCode)}`,
    ...(manageUrl ? [`Manage your bookings: ${manageUrl}`] : []),
  ].join('\n');
}

export function buildReminderText(booking: BookingForNotification, hoursBefore: number): string {
  return [
    `Reminder: your adventure is ${hoursBefore === 24 ? 'tomorrow' : 'coming up'}.`,
    `${booking.variant.title} · ${booking.bookingCode}`,
    `Date: ${formatLongDate(booking.bookingDate)}${booking.slotTime ? ` at ${booking.slotTime.time}` : ''}`,
    `Guests: ${booking.paxCount}`,
    pickupLine(booking),
    '',
    'Please arrive 15 minutes early and bring valid ID.',
    `Voucher & QR: ${voucherUrl(booking.bookingCode)}`,
  ].join('\n');
}

export function buildReviewRequestText(
  booking: BookingForNotification,
  reviewUrl: string
): string {
  return [
    `How was your ${booking.variant.title}?`,
    `Trip date: ${formatLongDate(booking.bookingDate)}`,
    '',
    'Tell other travellers what to expect — it takes a minute and helps our local guides.',
    `Leave a review: ${reviewUrl}`,
    '',
    `Booking: ${booking.bookingCode}`,
  ].join('\n');
}

function reviewRequestEmailHtml(booking: BookingForNotification, reviewUrl: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
      <h1 style="font-size:22px">How was your trip?</h1>
      <p>Hi ${escapeHtml(booking.customer.name)}, thanks for joining ${escapeHtml(booking.variant.title)}
      on ${escapeHtml(formatLongDate(booking.bookingDate))}.</p>
      <p>Tell other travellers what to expect — it takes a minute and helps our local guides.</p>
      <p>
        <a href="${reviewUrl}" style="display:inline-block;background:#000000;color:#FFEE00;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">
          Leave a review
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px">Booking ${escapeHtml(booking.bookingCode)}</p>
    </div>
  `.trim();
}

function emailHtml(
  booking: BookingForNotification,
  options: { title: string; intro: string },
): string {
  const manageUrl = buildCustomerBookingsUrl(booking.customer.id);
  const rows = [
    ['Booking code', booking.bookingCode],
    ['Activity', booking.variant.title],
    ['Date', formatLongDate(booking.bookingDate)],
    ['Time', booking.slotTime?.time ?? 'TBA'],
    ['Guests', String(booking.paxCount)],
    ['Total paid', formatIdr(booking.totalPrice)],
    ['Pickup', pickupLine(booking)],
  ];

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
      <h1 style="font-size:22px">${escapeHtml(options.title)}</h1>
      <p>Hi ${escapeHtml(booking.customer.name)}, ${escapeHtml(options.intro)}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:6px 0;color:#6b7280">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600">${escapeHtml(value)}</td></tr>`,
          )
          .join('')}
      </table>
      <p style="text-align:center">
        <a href="${voucherUrl(booking.bookingCode)}" style="display:inline-block;background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Open my voucher</a>
      </p>
      ${
        manageUrl
          ? `<p style="text-align:center;font-size:13px"><a href="${manageUrl}" style="color:#4b5563">Manage my bookings</a></p>`
          : ''
      }
      <p style="font-size:12px;color:#9ca3af">Venture Bali · instant confirmation · mobile-first booking</p>
    </div>
  `;
}

function confirmationEmailHtml(booking: BookingForNotification): string {
  return emailHtml(booking, {
    title: 'Your booking is confirmed',
    intro: 'your adventure is booked. Show the QR code at the meeting point.',
  });
}

function reminderEmailHtml(booking: BookingForNotification): string {
  return emailHtml(booking, {
    title: 'Your adventure is tomorrow',
    intro: 'here is your reminder. Please arrive 15 minutes early and bring valid ID.',
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalisePhone(value: string): string {
  const digits = value.replace(/[^\d]/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY is not configured' };

  const from = process.env.EMAIL_FROM ?? 'Venture Bali <onboarding@resend.dev>';

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      return { success: false, error: body?.message ?? `Resend HTTP ${response.status}` };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function record(
  booking: BookingForNotification,
  channel: NotificationChannel,
  recipient: string,
  subject: string,
  content: string,
  result: { success: boolean; error?: string },
): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customer.id,
        type: channel,
        recipient,
        subject,
        content,
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: result.success ? new Date() : null,
        errorMessage: result.error ?? null,
      },
    });
  } catch (error) {
    console.error('Could not persist NotificationLog:', error);
  }
}

async function deliver(
  booking: BookingForNotification,
  channel: NotificationChannel,
  recipient: string,
  subject: string,
  content: string,
  html?: string,
): Promise<NotificationResult> {
  const result =
    channel === 'WHATSAPP'
      ? await whatsappClient.sendTextMessage(normalisePhone(recipient), content)
      : await sendEmail(recipient, `${subject} · ${booking.bookingCode}`, html ?? content);

  await record(booking, channel, recipient, subject, content, result);
  return { channel, ...result };
}

function bookingInclude() {
  return {
    customer: { select: { id: true, name: true, email: true, whatsapp: true } },
    variant: { select: { title: true } },
    slotTime: { select: { time: true } },
  } as const;
}

const CONFIRMATION_SUBJECT = 'Booking confirmed';
const REMINDER_SUBJECT = 'Reminder H-24';

async function alreadyNotified(bookingId: string, subject: string): Promise<boolean> {
  const existing = await prisma.notificationLog.findFirst({
    where: { bookingId, subject, status: 'SENT' },
    select: { id: true },
  });
  return Boolean(existing);
}

/**
 * Send the confirmation that follows a settled payment.
 * Idempotent: repeated webhooks will not spam the customer.
 */
export async function notifyBookingPaid(bookingId: string): Promise<NotificationResult[]> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude(),
  });
  if (!booking) return [];

  const entity = booking as unknown as BookingForNotification;
  const text = buildConfirmationText(entity);

  if (await alreadyNotified(bookingId, CONFIRMATION_SUBJECT)) return [];

  const results = await Promise.all([
    deliver(entity, 'WHATSAPP', entity.customer.whatsapp, CONFIRMATION_SUBJECT, text),
    deliver(
      entity,
      'EMAIL',
      entity.customer.email,
      CONFIRMATION_SUBJECT,
      text,
      confirmationEmailHtml(entity),
    ),
  ]);

  return results;
}

/** Send the H-24 reminder for one paid booking. */
export async function sendBookingReminder(bookingId: string): Promise<NotificationResult[]> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude(),
  });
  if (!booking || booking.paymentStatus !== 'PAID') return [];

  if (await alreadyNotified(bookingId, REMINDER_SUBJECT)) return [];

  const entity = booking as unknown as BookingForNotification;
  const text = buildReminderText(entity, 24);

  const results = await Promise.all([
    deliver(entity, 'WHATSAPP', entity.customer.whatsapp, REMINDER_SUBJECT, text),
    deliver(
      entity,
      'EMAIL',
      entity.customer.email,
      REMINDER_SUBJECT,
      text,
      reminderEmailHtml(entity),
    ),
  ]);

  return results;
}

const REVIEW_SUBJECT = 'How was your trip?';

/**
 * Ask a guest for a review the day after the trip.
 *
 * Uses the same magic link the booking history uses, so no account is needed.
 * Idempotent per booking (NotificationLog subject) and skipped when a review
 * already exists.
 */
export async function sendReviewRequest(bookingId: string): Promise<NotificationResult[]> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { ...bookingInclude(), review: { select: { id: true } } },
  });

  if (!booking || booking.paymentStatus !== 'PAID' || booking.review) return [];
  if (await alreadyNotified(bookingId, REVIEW_SUBJECT)) return [];

  const token = createCustomerLinkToken(booking.customer.id);
  if (!token) return [];

  const reviewUrl = `${getBaseUrl()}/review/${booking.id}?token=${token}`;
  const entity = booking as unknown as BookingForNotification;
  const text = buildReviewRequestText(entity, reviewUrl);

  const results = await Promise.all([
    deliver(entity, 'WHATSAPP', entity.customer.whatsapp, REVIEW_SUBJECT, text),
    deliver(
      entity,
      'EMAIL',
      entity.customer.email,
      REVIEW_SUBJECT,
      text,
      reviewRequestEmailHtml(entity, reviewUrl),
    ),
  ]);

  return results;
}
