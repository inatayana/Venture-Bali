/**
 * Backwards-compatible locale shim.
 *
 * The translation data lives in `i18n-unified.ts` (re-exported by `i18n.ts`).
 * This file only keeps the old `{ code, label }[]` shape for existing callers.
 */

import { LOCALE_LABELS, translate as unifiedTranslate, type Locale } from './i18n';

export type { Locale } from './i18n';

export const LOCALES: ReadonlyArray<{ code: Locale; label: string }> = (['en', 'id'] as const).map(
  (code) => ({ code, label: LOCALE_LABELS[code] })
);

export const translate = unifiedTranslate;
