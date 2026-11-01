import { z } from 'zod';

/** Guest review payload. The token proves the booking belongs to the sender. */
export const reviewInputSchema = z.object({
  token: z.string().min(10, 'Missing access token'),
  bookingId: z.string().min(1, 'Missing booking'),
  rating: z.number().int().min(1, 'Pick a rating from 1 to 5').max(5),
  comment: z
    .string()
    .trim()
    .min(20, 'Tell us a little more (at least 20 characters)')
    .max(1000, 'Keep it under 1000 characters'),
  /** Display name; falls back to the booking customer's name when omitted. */
  guestName: z.string().trim().max(60, 'Keep your name under 60 characters').optional(),
  /** Display location; falls back to the customer's country when omitted. */
  guestLocation: z.string().trim().max(80, 'Keep your location under 80 characters').optional(),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

export interface ReviewableBooking {
  paymentStatus: string;
  /** Trip date as YYYY-MM-DD (local). */
  bookingDate: string;
  /** Id of an existing review for this booking, if any. */
  reviewId: string | null;
}

function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

/**
 * A trip can be reviewed once it is paid, the activity day is over and the
 * booking has not been reviewed yet (one review per booking).
 */
export function canReviewBooking(booking: ReviewableBooking, today: Date = new Date()): boolean {
  if (booking.paymentStatus !== 'PAID') return false;
  if (booking.reviewId) return false;
  return booking.bookingDate <= toLocalDateKey(today);
}

/** Friendly reason shown when a booking is not reviewable. */
export function reviewBlockedReason(
  booking: ReviewableBooking,
  today: Date = new Date()
): string | null {
  if (booking.paymentStatus !== 'PAID') return 'This booking is not paid yet.';
  if (booking.reviewId) return 'You already reviewed this trip — thank you!';
  if (booking.bookingDate > toLocalDateKey(today)) {
    return 'You can review this trip after the activity day.';
  }
  return null;
}
