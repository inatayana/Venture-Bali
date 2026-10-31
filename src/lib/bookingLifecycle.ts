/**
 * Venture Bali — booking lifecycle & inventory holds
 * ---------------------------------------------------
 * One place for the temporary hold that protects a slot while the guest pays,
 * and for the operational lifecycle used by the field-team job order.
 *
 * The hold starts when the booking is created (Step 2 of the hybrid checkout),
 * not when the payment sheet opens — that closes the window where a slot could
 * be oversold between guest details and payment.
 */

import type { BookingLifecycle, PaymentStatus } from '@/types/venture';

/** Directive default: 10 minutes. Override with BOOKING_HOLD_MINUTES. */
export const DEFAULT_HOLD_MINUTES = 10;

export function getHoldMinutes(): number {
  const raw = Number(process.env.BOOKING_HOLD_MINUTES ?? DEFAULT_HOLD_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_HOLD_MINUTES;
}

export function holdExpiresAt(now: Date = new Date(), minutes: number = getHoldMinutes()): Date {
  return new Date(now.getTime() + minutes * 60 * 1000);
}

/**
 * True while a PENDING booking still owns its capacity.
 * Paid bookings always own it; anything else never does.
 * Legacy PENDING rows without `expiresAt` are treated as expired (safe).
 */
export function isHoldActive(
  booking: { paymentStatus: PaymentStatus; expiresAt?: Date | null },
  now: Date = new Date(),
): boolean {
  if (booking.paymentStatus === 'PAID') return true;
  if (booking.paymentStatus !== 'PENDING') return false;
  if (!booking.expiresAt) return false;
  return booking.expiresAt.getTime() > now.getTime();
}

/** Map a gateway payment status onto the operational lifecycle. */
export function lifecycleForPaymentStatus(status: PaymentStatus): BookingLifecycle {
  if (status === 'PAID') return 'CONFIRMED';
  if (status === 'CANCELLED') return 'CANCELLED';
  return 'AWAITING_PAYMENT';
}

export const LIFECYCLE_LABELS: Record<BookingLifecycle, string> = {
  AWAITING_PAYMENT: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  NO_SHOW: 'No-show',
  CANCELLED: 'Cancelled',
};
