/**
 * Itinerary display helpers.
 *
 * The catalogue stores one `activity` string per step. To keep the mobile
 * timeline tidy we split it into a short title (max 45 characters, broken on a
 * word boundary) and a short description (max 110 characters). Nothing is
 * invented: title + description always come from the original sentence.
 */

export const ITINERARY_TITLE_MAX = 45;
export const ITINERARY_DESCRIPTION_MAX = 110;

export interface ItineraryStepDisplay {
  title: string;
  description: string;
}

function clip(value: string, max: number): string {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Break at the last space before the limit so words are never cut in half. */
function splitAtWord(value: string, max: number): [string, string] {
  const text = value.trim();
  if (text.length <= max) return [text, ''];

  const candidate = text.slice(0, max);
  const breakIndex = candidate.lastIndexOf(' ');
  const cut = breakIndex > 20 ? breakIndex : max;

  return [text.slice(0, cut).trimEnd(), text.slice(cut).trimStart()];
}

export function itineraryStepDisplay(activity: string): ItineraryStepDisplay {
  const [title, rest] = splitAtWord(activity, ITINERARY_TITLE_MAX);
  return {
    title: clip(title, ITINERARY_TITLE_MAX),
    description: rest ? clip(rest, ITINERARY_DESCRIPTION_MAX) : '',
  };
}
