import { getBookingProgress, type BookingProgressInput } from './bookingProgress';

const base: BookingProgressInput = {
  date: null,
  slot: null,
  zoneId: null,
  hotelAddress: '',
  isTba: false,
  customerName: '',
  customerEmail: '',
  customerWhatsApp: '',
  termsAccepted: false,
  waiverAccepted: false,
};

describe('getBookingProgress', () => {
  it('starts on the date step and marks guests done', () => {
    const progress = getBookingProgress(base, false);

    expect(progress.steps.map((step) => step.done)).toEqual([true, false, true, false]);
    expect(progress.activeIndex).toBe(1);
    expect(progress.complete).toBe(false);
  });

  it('blocks the pickup step for transfer packages without an area', () => {
    const progress = getBookingProgress(
      { ...base, date: new Date(), slot: { id: 'slot-1' } },
      true
    );

    expect(progress.activeIndex).toBe(2);
    expect(progress.steps[2].label).toBe('Pickup');
    expect(progress.steps[2].done).toBe(false);
  });

  it('accepts a TBA address as a complete pickup', () => {
    const progress = getBookingProgress(
      { ...base, date: new Date(), slot: { id: 'slot-1' }, zoneId: 'zone-1', isTba: true },
      true
    );

    expect(progress.steps[2].done).toBe(true);
    expect(progress.activeIndex).toBe(3);
  });

  it('uses the meeting point label for self-drive', () => {
    const progress = getBookingProgress(base, false);

    expect(progress.steps[2].label).toBe('Meeting point');
    expect(progress.steps[2].done).toBe(true);
  });

  it('only completes the flow with contact details and legal acceptance', () => {
    const filled = {
      ...base,
      date: new Date(),
      slot: { id: 'slot-1' },
      customerName: 'Made',
      customerEmail: 'made@example.com',
      customerWhatsApp: '81234567890',
    };

    expect(getBookingProgress(filled, false).activeIndex).toBe(3);
    expect(getBookingProgress(filled, false).complete).toBe(false);

    const complete = getBookingProgress(
      { ...filled, termsAccepted: true, waiverAccepted: true },
      false
    );
    expect(complete.complete).toBe(true);
    expect(complete.activeIndex).toBe(3);
  });
});
