/**
 * BaliWild i18n — single public entry point.
 *
 * All copy lives in `i18n-unified.ts`. This module exists so application code
 * has one stable import path; the old duplicate dictionary, global mutable
 * locale and legacy `t(key)` in the previous `i18n.ts` were unused and removed.
 */

export * from './i18n-unified';
