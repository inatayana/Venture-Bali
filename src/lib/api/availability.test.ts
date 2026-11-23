import { getBookableSlots } from '@/lib/api/availability';

describe('getBookableSlots', () => {
  const variant = {
    slotTimes: [
      { id: 'slot-open', time: '08:00 AM', maxCapacity: 4, currentBookings: 0, isAvailable: true },
      { id: 'slot-full', time: '10:00 AM', maxCapacity: 2, currentBookings: 2, isAvailable: true },
      { id: 'slot-closed', time: '12:00 PM', maxCapacity: 4, currentBookings: 0, isAvailable: false },
    ],
  };

  it('returns open slots within capacity for a future date', () => {
    const slots = getBookableSlots(variant, {
      bookingDate: '2026-11-24',
      fulfillmentMode: 'SELF_DRIVE',
      paxCount: 2,
      now: new Date('2026-11-23T07:00:00Z'),
    });

    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({
      id: 'slot-open',
      time: '08:00 AM',
      capacity: 4,
      booked: 0,
      available: 4,
    });
  });

  it('excludes slots that are full or closed', () => {
    const slots = getBookableSlots(variant, {
      bookingDate: '2026-11-24',
      fulfillmentMode: 'SELF_DRIVE',
      paxCount: 2,
      now: new Date('2026-11-23T07:00:00Z'),
    });

    expect(slots.map((slot) => slot.id)).not.toContain('slot-full');
    expect(slots.map((slot) => slot.id)).not.toContain('slot-closed');
  });

  it('excludes slots inside the self-drive cut-off', () => {
    const slots = getBookableSlots(variant, {
      bookingDate: '2026-11-23', // today
      fulfillmentMode: 'SELF_DRIVE',
      paxCount: 1,
      now: new Date('2026-11-23T07:00:00Z'), // 07:00Z == 15:00 WITA
    });

    // '08:00 AM' is less than 2h away in WITA — must not be bookable.
    expect(slots.map((slot) => slot.id)).not.toContain('slot-open');
  });

  it('returns an empty list when the variant has no slot times', () => {
    expect(getBookableSlots(null, { bookingDate: '2026-11-24', fulfillmentMode: 'SELF_DRIVE' })).toEqual([]);
  });
});
