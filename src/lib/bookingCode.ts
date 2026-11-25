/**
 * BaliWild — customer-facing booking code
 * -----------------------------------------
 * New bookings use `BW-<YYYY>-<XXXX>`. Legacy `BK-<timestamp>-<random>` values
 * remain valid: QR payloads reference the booking id, never the code, so no
 * backfill is required and old vouchers keep working.
 */

import { randomInt } from 'node:crypto';

const SUFFIX_SPACE = 36 ** 4; // 1,679,616 combinations

export function formatBookingCode(value: number, date: Date = new Date()): string {
  const suffix = Math.abs(Math.trunc(value)) % SUFFIX_SPACE;
  return `BW-${date.getUTCFullYear()}-${suffix.toString(36).toUpperCase().padStart(4, '0')}`;
}

export function generateBookingCode(): string {
  return formatBookingCode(randomInt(0, SUFFIX_SPACE));
}

/** Accepts both the new format and legacy BK- codes (manual check-in fallback). */
export function isBookingCode(value: string | null | undefined): boolean {
  if (!value) return false;
  return (
    /^BW-\d{4}-[0-9A-Z]{4}$/.test(value) || /^BK-[0-9A-Z]+-[0-9A-Z]+$/.test(value)
  );
}
