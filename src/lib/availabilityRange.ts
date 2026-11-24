import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { isSlotBookable } from '@/lib/pricing';
import { hoursBeforeActivity } from '@/lib/refundUtils';
import type { FulfillmentMode } from '@prisma/client';

/**
 * Month-range availability for the PDP calendar.
 *
 * The single-date endpoint answers "what can I book on this day?" after the
 * guest picks a date. The calendar needs the opposite direction: mark every
 * day in the visible month that has no bookable departure, before the guest
 * taps. This module is pure so the rules stay identical to the single-date
 * route and can be unit-tested without a database.
 */

/** Upper bound for one range request (two months). */
export const MAX_RANGE_DAYS = 62;

export interface AvailabilitySlotInput {
  id: string;
  time: string;
  maxCapacity: number;
  cutoffHours: number | null;
}

export interface AvailabilityBookingInput {
  slotTimeId: string | null;
  bookingDate: string | null;
  paxCount: number | null;
}

export interface AvailabilityDay {
  date: string;
  totalAvailable: number;
  isFullyBooked: boolean;
  /** The variant is explicitly blacked out on this date. */
  closed: boolean;
}

export interface BuildAvailabilityDaysInput {
  slots: AvailabilitySlotInput[];
  bookings: AvailabilityBookingInput[];
  blackoutDates: string[];
  fulfillmentMode: FulfillmentMode;
  from: string;
  to: string;
  now?: Date;
}

function assertIsoDate(value: string, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError(`${label} must be YYYY-MM-DD`);
  }
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime()) || format(parsed, 'yyyy-MM-dd') !== value) {
    throw new RangeError(`${label} is not a valid calendar date`);
  }
}

/** Validate the range and return every ISO date it covers, inclusive. */
export function parseAvailabilityRange(from: string, to: string): string[] {
  assertIsoDate(from, 'from');
  assertIsoDate(to, 'to');

  const start = parseISO(from);
  const end = parseISO(to);
  if (start > end) throw new RangeError('`from` must be on or before `to`');

  const days = eachDayOfInterval({ start, end });
  if (days.length > MAX_RANGE_DAYS) {
    throw new RangeError(`Date range cannot exceed ${MAX_RANGE_DAYS} days`);
  }

  return days.map((day) => format(day, 'yyyy-MM-dd'));
}

/**
 * Compute one entry per date. Mirrors the single-date route exactly:
 * `totalAvailable` sums spotsLeft across every active slot, while
 * `isFullyBooked` also requires at least one slot to pass the cutoff and
 * 24-hour lead-time rules.
 */
export function buildAvailabilityDays({
  slots,
  bookings,
  blackoutDates,
  fulfillmentMode,
  from,
  to,
  now = new Date(),
}: BuildAvailabilityDaysInput): AvailabilityDay[] {
  const dates = parseAvailabilityRange(from, to);
  const blackouts = new Set(blackoutDates);

  const reserved = new Map<string, number>();
  for (const booking of bookings) {
    if (!booking.slotTimeId || !booking.bookingDate) continue;
    const key = `${booking.bookingDate}|${booking.slotTimeId}`;
    reserved.set(key, (reserved.get(key) ?? 0) + (booking.paxCount ?? 0));
  }

  return dates.map((date) => {
    const closed = blackouts.has(date);
    let totalAvailable = 0;
    let hasEnabled = false;

    for (const slot of slots) {
      const taken = reserved.get(`${date}|${slot.id}`) ?? 0;
      const spotsLeft = Math.max(0, slot.maxCapacity - taken);
      totalAvailable += spotsLeft;

      if (closed || spotsLeft === 0) continue;
      const bookable =
        isSlotBookable(date, slot.time, fulfillmentMode, now, slot.cutoffHours) &&
        hoursBeforeActivity(date, slot.time, now) >= 24;
      if (bookable) hasEnabled = true;
    }

    return {
      date,
      totalAvailable: closed ? 0 : totalAvailable,
      isFullyBooked: closed || totalAvailable === 0 || !hasEnabled,
      closed,
    };
  });
}
