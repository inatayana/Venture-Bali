/**
 * Honest demand badges.
 *
 * Every number shown to a guest comes from real paid bookings (see
 * ventureWithRelations) — nothing here invents urgency. Below the visibility
 * threshold the badge simply does not render.
 */

/** Minimum real bookings before a badge is worth showing. */
export const DEMAND_BADGE_MIN = 3;
/** From this count up, the badge escalates to a highlighted variant. */
export const DEMAND_BADGE_HOT = 12;

export function demandBadgeLabel(bookedLast48h: number | undefined): string | null {
  if (!bookedLast48h || bookedLast48h < DEMAND_BADGE_MIN) return null;
  if (bookedLast48h >= DEMAND_BADGE_HOT) {
    return `🔥 ${bookedLast48h}× booked in the last 48 hours`;
  }
  return `${bookedLast48h}× booked in the last 48 hours`;
}

/** True when the badge should render in its highlighted (hot) style. */
export function demandBadgeIsHot(bookedLast48h: number | undefined): boolean {
  return Boolean(bookedLast48h && bookedLast48h >= DEMAND_BADGE_HOT);
}
