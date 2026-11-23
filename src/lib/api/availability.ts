/**
 * Public API v1 — availability resolution
 * --------------------------------------
 * Pure slot-selection logic shared by the `/api/v1/availability` endpoint and
 * (later) any public client that needs to render bookable slots.
 */

import type { FulfillmentMode } from '@/types/venture';
import { getAvailableSlots, isSlotBookable } from '@/lib/pricing';

export interface AvailableSlot {
  id: string;
  time: string;
  capacity: number;
  booked: number;
  available: number;
}

export interface GetBookableSlotsOptions {
  /** Activity date in `YYYY-MM-DD` (local adventure date). */
  bookingDate: string;
  fulfillmentMode: FulfillmentMode;
  paxCount?: number;
  now?: Date;
}

/**
 * Slots that are still bookable for a given date:
 * open, within capacity for the party, and past the mode cut-off
 * (SELF_DRIVE: bookable until 2h before departure; transfers: D-1 22:00 WITA).
 */
export function getBookableSlots(
  variant:
    | {
        slotTimes?: Array<{
          id?: string;
          time: string;
          maxCapacity: number;
          currentBookings: number;
          isAvailable: boolean;
        }>;
      }
    | null
    | undefined,
  options: GetBookableSlotsOptions,
): AvailableSlot[] {
  const slots = getAvailableSlots(variant ?? { slotTimes: [] }, options.paxCount ?? 1);
  const now = options.now ?? new Date();

  return slots.filter((slot) =>
    isSlotBookable(options.bookingDate, slot.time, options.fulfillmentMode, now),
  );
}
