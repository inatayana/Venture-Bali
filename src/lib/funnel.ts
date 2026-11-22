/**
 * Shared funnel vocabulary for analytics.
 *
 * The app already emits view_item, select_package, begin_checkout,
 * checkout_step_* and purchase. This registry keeps the step names stable so
 * a future dashboard or GTM container can be wired without renaming events.
 */

import { track } from './analytics';

export const FUNNEL_STEPS = [
  'view_item',
  'select_package',
  'begin_checkout',
  'checkout_step_view',
  'checkout_step_complete',
  'purchase',
  'review_submit',
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export function trackFunnelStep(
  step: FunnelStep,
  payload: Record<string, unknown> = {}
): void {
  track(step, { funnel: 'adventure_booking', ...payload });
}
