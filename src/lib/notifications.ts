/**
 * BaliWild — booking notifications
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
import {
  BRAND_EMAIL_BOOKING,
  BRAND_EMAIL_SUPPORT,
} from '@/lib/brand';
import { buildCustomerBookingsUrl, createReviewToken } from '@/lib/customerLink';
import { buildReviewQrUrl, buildReviewUrl } from '@/lib/reviewLink';

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
  lifecycleStatus: string;
  hotelAddress: string | null;
  isTba: boolean;
  customer: { id: string; name: string; email: string; whatsapp: string };
  /** Venture details that make reminders package-specific (what to bring,
   *  where exactly to go). Optional so legacy callers still type-check. */
  variant: {
    title: string;
    venture?: {
      title?: string;
      meetingPoint?: string | null;
      meetingPointMapsUrl?: string | null;
      essentialInfo?: unknown;
    } | null;
  };
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

/** Google Maps link for the venture meeting point (explicit URL wins). */
function ventureMapsUrl(booking: BookingForNotification): string | null {
  const venture = booking.variant.venture;
  if (!venture) return null;
  if (venture.meetingPointMapsUrl) return venture.meetingPointMapsUrl;
  if (!venture.meetingPoint) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${venture.meetingPoint} Bali`
  )}`;
}

/** Up to four what-to-bring items from the venture's essential info. */
function whatToBringLines(booking: BookingForNotification): string[] {
  const info = booking.variant.venture?.essentialInfo;
  if (!isRecord(info)) return [];
  const items = info.whatToBring;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 4);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickupLine(booking: BookingForNotification): string {
  if (booking.fulfillmentMode === 'SELF_DRIVE') {
    const meetingPoint = booking.variant.venture?.meetingPoint;
    const maps = ventureMapsUrl(booking);
    const where = meetingPoint ?? 'the activity location — see your voucher for the pin';
    return maps
      ? `Meeting point: ${where} · Map: ${maps}`
      : `Meeting point: ${where}.`;
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
  const bring = whatToBringLines(booking);
  return [
    `Reminder: your adventure is ${hoursBefore === 24 ? 'tomorrow' : 'coming up'}.`,
    `${booking.variant.title} · ${booking.bookingCode}`,
    `Date: ${formatLongDate(booking.bookingDate)}${booking.slotTime ? ` at ${booking.slotTime.time}` : ''}`,
    `Guests: ${booking.paxCount}`,
    pickupLine(booking),
    ...(bring.length > 0 ? ['', 'What to bring:', ...bring.map((item) => `• ${item}`)] : []),
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

function reviewRequestEmailHtml(
  booking: BookingForNotification,
  reviewUrl: string,
  qrUrl: string,
  options: { title?: string; intro?: string } = {}
): string {
  const title = options.title ?? 'How was your trip?';
  const intro =
    options.intro ??
    'Tell other travellers what to expect — it takes a minute and helps our local guides.';
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#000000">
      <h1 style="font-size:22px">${escapeHtml(title)}</h1>
      <p>Hi ${escapeHtml(booking.customer.name)}, thanks for joining ${escapeHtml(booking.variant.title)}
      on ${escapeHtml(formatLongDate(booking.bookingDate))}.</p>
      <p>${escapeHtml(intro)}</p>
      <p>
        <a href="${reviewUrl}" style="display:inline-block;background:#000000;color:#FFEE00;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">
          Leave a review
        </a>
      </p>
      <p style="margin-top:24px;color:#374151;font-size:14px">
        On your phone? Scan this code to open the review form:
      </p>
      <p style="margin:8px 0">
        <img src="${qrUrl}" width="180" height="180" alt="QR code to review your trip" style="display:block;border:1px solid #e5e7eb;border-radius:12px" />
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
  const bring = whatToBringLines(booking);
  const rows = [
    ['Booking code', booking.bookingCode],
    ['Activity', booking.variant.title],
    ['Date', formatLongDate(booking.bookingDate)],
    ['Time', booking.slotTime?.time ?? 'TBA'],
    ['Guests', String(booking.paxCount)],
    ['Total paid', formatIdr(booking.totalPrice)],
    ['Pickup', pickupLine(booking)],
    ...(bring.length > 0 ? [['What to bring', bring.join(', ')]] : []),
  ];

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#000000">
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
        <a href="${voucherUrl(booking.bookingCode)}" style="display:inline-block;background:#000000;color:#FFEE00;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Open my voucher</a>
      </p>
      ${
        manageUrl
          ? `<p style="text-align:center;font-size:13px"><a href="${manageUrl}" style="color:#4b5563">Manage my bookings</a></p>`
          : ''
      }
      <p style="font-size:12px;color:#9ca3af;text-align:center">Need help? <a href="mailto:${BRAND_EMAIL_SUPPORT}" style="color:#000000">${BRAND_EMAIL_SUPPORT}</a></p>
      <p style="font-size:12px;color:#9ca3af">BaliWild · Own the wild. · instant confirmation · mobile-first booking</p>
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

  const from = process.env.EMAIL_FROM ?? `BaliWild <${BRAND_EMAIL_BOOKING}>`;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        reply_to: BRAND_EMAIL_SUPPORT,
      }),
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
    variant: {
      select: {
        title: true,
        venture: {
          select: {
            title: true,
            meetingPoint: true,
            meetingPointMapsUrl: true,
            essentialInfo: true,
          },
        },
      },
    },
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

/** True only when a successful message was sent before the cutoff. */
async function notifiedBefore(
  bookingId: string,
  subject: string,
  before: Date,
): Promise<boolean> {
  const existing = await prisma.notificationLog.findFirst({
    where: { bookingId, subject, status: 'SENT', sentAt: { lte: before } },
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
const REVIEW_REMINDER_SUBJECT = 'A quick reminder: how was your trip?';

function buildReviewInvite(booking: BookingForNotification): { url: string; qrUrl: string } | null {
  const token = createReviewToken(booking.customer.id, booking.id);
  if (!token) return null;
  return {
    url: buildReviewUrl(booking.id, token),
    qrUrl: buildReviewQrUrl(booking.id, token),
  };
}

/**
 * Ask a guest for a review once operations has marked the trip COMPLETED.
 *
 * Uses a scoped 180-day review token, so the link can never open the rest of
 * the customer's bookings. Idempotent per booking and skipped when a review
 * already exists.
 */
export async function sendReviewRequest(bookingId: string): Promise<NotificationResult[]> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { ...bookingInclude(), review: { select: { id: true } } },
  });

  if (
    !booking ||
    booking.paymentStatus !== 'PAID' ||
    booking.lifecycleStatus !== 'COMPLETED' ||
    booking.review
  ) {
    return [];
  }
  if (await alreadyNotified(bookingId, REVIEW_SUBJECT)) return [];

  const invite = buildReviewInvite(booking as unknown as BookingForNotification);
  if (!invite) return [];

  const entity = booking as unknown as BookingForNotification;
  const text = buildReviewRequestText(entity, invite.url);

  return Promise.all([
    deliver(entity, 'WHATSAPP', entity.customer.whatsapp, REVIEW_SUBJECT, text),
    deliver(
      entity,
      'EMAIL',
      entity.customer.email,
      REVIEW_SUBJECT,
      text,
      reviewRequestEmailHtml(entity, invite.url, invite.qrUrl),
    ),
  ]);
}

/** One follow-up, three days after the first request, only if still unreviewed. */
export async function sendReviewReminder(bookingId: string): Promise<NotificationResult[]> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { ...bookingInclude(), review: { select: { id: true } } },
  });

  if (
    !booking ||
    booking.paymentStatus !== 'PAID' ||
    booking.lifecycleStatus !== 'COMPLETED' ||
    booking.review
  ) {
    return [];
  }
  // Never remind someone who never received the first request, and never
  // remind in the same run that the first request was just sent.
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  if (!(await notifiedBefore(bookingId, REVIEW_SUBJECT, threeDaysAgo))) return [];
  if (await alreadyNotified(bookingId, REVIEW_REMINDER_SUBJECT)) return [];

  const invite = buildReviewInvite(booking as unknown as BookingForNotification);
  if (!invite) return [];

  const entity = booking as unknown as BookingForNotification;
  const text = [
    `Still thinking about your ${entity.variant.title}?`,
    'A one-minute review helps the next traveller and our local guides.',
    `Leave a review: ${invite.url}`,
    '',
    `Booking: ${entity.bookingCode}`,
  ].join('\n');

  return Promise.all([
    deliver(entity, 'WHATSAPP', entity.customer.whatsapp, REVIEW_REMINDER_SUBJECT, text),
    deliver(
      entity,
      'EMAIL',
      entity.customer.email,
      REVIEW_REMINDER_SUBJECT,
      text,
      reviewRequestEmailHtml(entity, invite.url, invite.qrUrl, {
        title: 'Still thinking about your trip?',
        intro: 'A one-minute review helps the next traveller and our local guides.',
      }),
    ),
  ]);
}

const MODERATION_ALERT_SUBJECT = 'Review needs moderation';

const CANCELLATION_SUBJECT = 'Booking cancelled';
const RESCHEDULE_SUBJECT = 'Booking rescheduled';
const REFUND_PROCESSED_SUBJECT = 'Refund processed';
const HOLD_EXPIRED_SUBJECT = 'Reservation hold expired';
const VOUCHER_DELIVERY_SUBJECT = 'Your voucher';

/**
 * Cancellation confirmation (customer-initiated via /my/bookings).
 */
export async function sendCancellationConfirmation(
  bookingId: string,
  refundAmount: number,
  feeAmount: number,
  method: 'MIDTRANS' | 'MANUAL'
): Promise<NotificationResult[]> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude(),
  });
  if (!booking) return [];

  const entity = booking as unknown as BookingForNotification;
  const text = [
    `Your booking ${entity.bookingCode} (${entity.variant.title}) has been cancelled.`,
    `Date: ${formatLongDate(entity.bookingDate)}${entity.slotTime ? ` at ${entity.slotTime.time}` : ''}`,
    `Refund: ${formatIdr(refundAmount)} (fee ${formatIdr(feeAmount)})`,
    `Method: ${method === 'MIDTRANS' ? 'Original payment method (Midtrans)' : 'Bank transfer — we will contact you'}`,
    '',
    `Track status: ${buildCustomerBookingsUrl(entity.customer.id) ?? 'N/A'}`,
  ].join('\n');

  const html = emailHtml(entity, {
    title: 'Booking cancelled',
    intro: `your cancellation is confirmed. Refund ${formatIdr(refundAmount)} will be processed via ${method === 'MIDTRANS' ? 'Midtrans' : 'bank transfer'}.`,
  });

  return Promise.all([
    deliver(entity, 'WHATSAPP', entity.customer.whatsapp, CANCELLATION_SUBJECT, text),
    deliver(entity, 'EMAIL', entity.customer.email, CANCELLATION_SUBJECT, text, html),
  ]);
}

/**
 * Reschedule confirmation.
 */
export async function sendRescheduleConfirmation(
  bookingId: string,
  oldDate: string,
  oldTime: string | null,
  newDate: string,
  newTime: string | null
): Promise<NotificationResult[]> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude(),
  });
  if (!booking) return [];

  const entity = booking as unknown as BookingForNotification;
  const text = [
    `Your booking ${entity.bookingCode} (${entity.variant.title}) has been rescheduled.`,
    `Old: ${formatLongDate(oldDate)}${oldTime ? ` at ${oldTime}` : ''}`,
    `New: ${formatLongDate(newDate)}${newTime ? ` at ${newTime}` : ''}`,
    `Guests: ${entity.paxCount}`,
    pickupLine(entity),
    '',
    `Voucher & QR: ${voucherUrl(entity.bookingCode)}`,
    `Manage: ${buildCustomerBookingsUrl(entity.customer.id) ?? 'N/A'}`,
  ].join('\n');

  const html = emailHtml(entity, {
    title: 'Booking rescheduled',
    intro: `your adventure has been moved to the new date/time above.`,
  });

  return Promise.all([
    deliver(entity, 'WHATSAPP', entity.customer.whatsapp, RESCHEDULE_SUBJECT, text),
    deliver(entity, 'EMAIL', entity.customer.email, RESCHEDULE_SUBJECT, text, html),
  ]);
}

/**
 * Refund processed notification (admin completes refund).
 */
export async function sendRefundProcessed(
  bookingId: string,
  amountIdr: number,
  method: 'MIDTRANS' | 'MANUAL',
  providerRef?: string
): Promise<NotificationResult[]> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude(),
  });
  if (!booking) return [];

  const entity = booking as unknown as BookingForNotification;
  const text = [
    `Your refund for booking ${entity.bookingCode} (${entity.variant.title}) has been processed.`,
    `Amount: ${formatIdr(amountIdr)}`,
    `Method: ${method === 'MIDTRANS' ? 'Midtrans (original payment method)' : 'Bank transfer'}`,
    providerRef ? `Provider ref: ${providerRef}` : '',
    '',
    'Funds typically appear in 1–5 business days depending on your bank.',
  ].filter(Boolean).join('\n');

  const html = emailHtml(entity, {
    title: 'Refund processed',
    intro: `your refund of ${formatIdr(amountIdr)} is complete.`,
  });

  return Promise.all([
    deliver(entity, 'WHATSAPP', entity.customer.whatsapp, REFUND_PROCESSED_SUBJECT, text),
    deliver(entity, 'EMAIL', entity.customer.email, REFUND_PROCESSED_SUBJECT, text, html),
  ]);
}

/**
 * Hold expired notification (cron reaped a PENDING booking).
 */
export async function sendHoldExpired(
  bookingId: string
): Promise<NotificationResult[]> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude(),
  });
  if (!booking || booking.paymentStatus !== 'CANCELLED') return [];

  const entity = booking as unknown as BookingForNotification;
  const text = [
    `Your reservation ${entity.bookingCode} (${entity.variant.title}) for ${formatLongDate(entity.bookingDate)} has expired.`,
    'The hold was released because payment was not completed within the 10-minute window.',
    '',
    'You can book again anytime — slots may still be available.',
    `Browse adventures: ${getBaseUrl()}`,
  ].join('\n');

  const html = emailHtml(entity, {
    title: 'Reservation hold expired',
    intro: 'your reservation could not be completed in time. The slot has been released.',
  });

  return Promise.all([
    deliver(entity, 'WHATSAPP', entity.customer.whatsapp, HOLD_EXPIRED_SUBJECT, text),
    deliver(entity, 'EMAIL', entity.customer.email, HOLD_EXPIRED_SUBJECT, text, html),
  ]);
}

/**
 * Voucher delivery (standalone, e.g. when guest requests it directly).
 */
export async function sendVoucherDelivery(
  bookingId: string
): Promise<NotificationResult[]> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude(),
  });
  if (!booking || booking.paymentStatus !== 'PAID') return [];

  const entity = booking as unknown as BookingForNotification;
  const text = [
    `Here is your voucher for ${entity.variant.title}.`,
    `Booking: ${entity.bookingCode}`,
    `Date: ${formatLongDate(entity.bookingDate)}${entity.slotTime ? ` at ${entity.slotTime.time}` : ''}`,
    `Guests: ${entity.paxCount}`,
    pickupLine(entity),
    '',
    `Voucher & QR: ${voucherUrl(entity.bookingCode)}`,
    `Manage: ${buildCustomerBookingsUrl(entity.customer.id) ?? 'N/A'}`,
  ].join('\n');

  const html = confirmationEmailHtml(entity);

  return Promise.all([
    deliver(entity, 'WHATSAPP', entity.customer.whatsapp, VOUCHER_DELIVERY_SUBJECT, text),
    deliver(entity, 'EMAIL', entity.customer.email, VOUCHER_DELIVERY_SUBJECT, text, html),
  ]);
}
export async function notifyReviewNeedsModeration(input: {
  bookingId?: string | null;
  customerId?: string | null;
  bookingCode?: string;
  reference?: string;
  ventureTitle: string;
  rating: number;
  comment: string;
  guestName: string;
}): Promise<NotificationResult> {
  const subject = MODERATION_ALERT_SUBJECT;
  const reference = input.reference ?? input.bookingCode ?? 'Founding guest';
  const content = [
    `${input.rating}/5 · ${input.ventureTitle}`,
    `Guest: ${input.guestName}`,
    `Reference: ${reference}`,
    '',
    input.comment,
    '',
    `Moderate: ${getBaseUrl()}/admin/reviews`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#000000">
      <h1 style="font-size:20px">Review needs moderation</h1>
      <p><strong>${input.rating}/5</strong> · ${escapeHtml(input.ventureTitle)}</p>
      <p>Guest: ${escapeHtml(input.guestName)} · Reference ${escapeHtml(reference)}</p>
      <blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #FFEE00;background:#fafafa">
        ${escapeHtml(input.comment)}
      </blockquote>
      <p><a href="${getBaseUrl()}/admin/reviews" style="display:inline-block;background:#000000;color:#FFEE00;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Open moderation queue</a></p>
    </div>
  `.trim();

  const result = await sendEmail(BRAND_EMAIL_SUPPORT, `${subject} · ${reference}`, html);

  try {
    await prisma.notificationLog.create({
      data: {
        bookingId: input.bookingId ?? null,
        customerId: input.customerId ?? null,
        type: 'EMAIL',
        recipient: BRAND_EMAIL_SUPPORT,
        subject,
        content,
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: result.success ? new Date() : null,
        errorMessage: result.error ?? null,
      },
    });
  } catch (error) {
    console.error('Could not persist moderation alert log:', error);
  }

  return { channel: 'EMAIL', ...result };
}
