import { getBookingProgress, type BookingProgressInput } from './bookingProgress';

const base: BookingProgressInput = {
  date: null,
  slot: null,
  vehicleClassType: null,
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
  it('starts on the plan step', () => {
    const progress = getBookingProgress(base, false);

    expect(progress.steps.map((step) => step.key)).toEqual(['plan', 'details']);
    expect(progress.steps.map((step) => step.done)).toEqual([false, false]);
    expect(progress.activeIndex).toBe(0);
    expect(progress.complete).toBe(false);
  });

  it('keeps the plan open for transfer packages without an area', () => {
    const progress = getBookingProgress(
      { ...base, date: new Date(), slot: { id: 'slot-1' } },
      true
    );

    expect(progress.steps[0].done).toBe(false);
    expect(progress.activeIndex).toBe(0);
  });

  it('accepts a TBA address as a complete pickup', () => {
    const progress = getBookingProgress(
      { ...base, date: new Date(), slot: { id: 'slot-1' }, zoneId: 'zone-1', isTba: true },
      true
    );

    expect(progress.steps[0].done).toBe(true);
    expect(progress.activeIndex).toBe(1);
  });

  it('completes self-drive plans with a date and slot', () => {
    const progress = getBookingProgress(
      { ...base, date: new Date(), slot: { id: 'slot-1' } },
      false
    );

    expect(progress.steps[0].done).toBe(true);
    expect(progress.steps[1].done).toBe(false);
  });

  it('requires a vehicle class for private transfers', () => {
    const withoutVehicle = getBookingProgress(
      { ...base, date: new Date(), slot: { id: 'slot-1' }, zoneId: 'zone-1', isTba: true },
      true,
      true
    );
    expect(withoutVehicle.steps[0].done).toBe(false);

    const withVehicle = getBookingProgress(
      {
        ...base,
        date: new Date(),
        slot: { id: 'slot-1' },
        zoneId: 'zone-1',
        isTba: true,
        vehicleClassType: 'MPV',
      },
      true,
      true
    );
    expect(withVehicle.steps[0].done).toBe(true);
  });

  it('never treats a custom-quote area as ready for online payment', () => {
    const progress = getBookingProgress(
      { ...base, date: new Date(), slot: { id: 'slot-1' }, zoneId: 'zone-4', customQuote: true },
      true
    );

    expect(progress.steps[0].done).toBe(false);
    expect(progress.activeIndex).toBe(0);
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

    expect(getBookingProgress(filled, false).activeIndex).toBe(1);
    expect(getBookingProgress(filled, false).complete).toBe(false);

    const complete = getBookingProgress(
      { ...filled, termsAccepted: true, waiverAccepted: true },
      false
    );
    expect(complete.complete).toBe(true);
    expect(complete.activeIndex).toBe(1);
  });
});
