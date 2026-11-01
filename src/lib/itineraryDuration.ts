/**
 * Itinerary duration helpers.
 *
 * Products have flexible start times, so the timeline shows how long each step
 * takes instead of a fixed clock time, plus a total at the bottom.
 */

/** "~20 mins" / "~1 h" / "~1 h 15 m". */
export function formatDuration(minutes: number): string {
  const value = Math.max(0, Math.round(minutes));
  if (value < 60) return `~${value} mins`;

  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return rest === 0 ? `~${hours} h` : `~${hours} h ${rest} m`;
}

export interface DurationStep {
  durationMinutes?: number;
}

/** Sum of every step that declares minutes; null when nothing is declared. */
export function totalDurationMinutes(steps: readonly DurationStep[]): number | null {
  const total = steps.reduce((sum, step) => sum + (step.durationMinutes ?? 0), 0);
  return total > 0 ? total : null;
}

export const TRANSFER_NOTE =
  'Drive time from Ubud is around 40 minutes; pickups from South Bali, Canggu or Uluwatu take longer.';
