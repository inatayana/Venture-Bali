import { FUNNEL_STEPS, trackFunnelStep } from './funnel';

jest.mock('./analytics', () => ({ track: jest.fn() }));

import { track } from './analytics';

const mockedTrack = track as jest.Mock;

describe('funnel vocabulary', () => {
  beforeEach(() => mockedTrack.mockClear());

  it('keeps the seven booking funnel steps stable', () => {
    expect(FUNNEL_STEPS).toEqual([
      'view_item',
      'select_package',
      'begin_checkout',
      'checkout_step_view',
      'checkout_step_complete',
      'purchase',
      'review_submit',
    ]);
  });

  it('adds a funnel tag without overwriting event data', () => {
    trackFunnelStep('begin_checkout', { ventureId: 'vtr-001' });
    expect(mockedTrack).toHaveBeenCalledWith('begin_checkout', {
      funnel: 'adventure_booking',
      ventureId: 'vtr-001',
    });
  });
});
