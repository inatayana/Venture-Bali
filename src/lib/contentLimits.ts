/**
 * Display limits for product copy.
 *
 * Hooks and highlights live in tight mobile layouts, so they are clamped at a
 * word boundary instead of wrapping into an awkward third line.
 */

export const HOOK_MAX = 200;
export const HIGHLIGHT_MAX = 90;

/** Trim and, when needed, cut at the last space before `max` and add an ellipsis. */
export function clampText(value: string, max: number): string {
  const text = value.trim();
  if (text.length <= max) return text;

  const slice = text.slice(0, max - 1);
  const breakIndex = slice.lastIndexOf(' ');
  const cut = breakIndex > max * 0.6 ? breakIndex : max - 1;

  return `${slice.slice(0, cut).trimEnd()}…`;
}
