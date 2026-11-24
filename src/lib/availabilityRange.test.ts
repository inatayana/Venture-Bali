import { buildAvailabilityDays, parseAvailabilityRange } from './availabilityRange';

const NOW = new Date('2026-11-20T09:00:00Z');

const SLOTS = [
  { id: 'slot-1', time: '08:00', maxCapacity: 10, cutoffHours: null },
  { id: 'slot-2', time: '14:00', maxCapacity: 10, cutoffHours: null },
];

function day(overrides: Partial<ReturnType<typeof buildAvailabilityDays>[number]> = {}) {
  return { date: '2026-12-01', totalAvailable: 0, isFullyBooked: true, closed: false, ...overrides };
}

describe('parseAvailabilityRange', () => {
  it('returns every ISO date in the range, inclusive', () => {
    expect(parseAvailabilityRange('2026-12-01', '2026-12-03')).toEqual([
      '2026-12-01',
      '2026-12-02',
      '2026-12-03',
    ]);
  });

  it('accepts a single-day range', () => {
    expect(parseAvailabilityRange('2026-12-01', '2026-12-01')).toEqual(['2026-12-01']);
  });

  it('rejects reversed ranges and non-calendar dates', () => {
    expect(() => parseAvailabilityRange('2026-12-02', '2026-12-01')).toThrow(RangeError);
    expect(() => parseAvailabilityRange('2026-02-30', '2026-12-01')).toThrow(RangeError);
    expect(() => parseAvailabilityRange('2026-13-01', '2026-12-01')).toThrow(RangeError);
  });

  it('rejects ranges longer than 62 days', () => {
    expect(() => parseAvailabilityRange('2026-01-01', '2027-03-01')).toThrow(/62 days/);
    expect(() => parseAvailabilityRange('2026-01-01', '2026-02-01')).not.toThrow();
  });
});

describe('buildAvailabilityDays', () => {
  it('marks a day with free capacity as not fully booked', () => {
    const result = buildAvailabilityDays({
      slots: SLOTS,
      bookings: [],
      blackoutDates: [],
      fulfillmentMode: 'SELF_DRIVE',
      from: '2026-12-01',
      to: '2026-12-01',
      now: NOW,
    });

    expect(result).toEqual([day({ date: '2026-12-01', totalAvailable: 20, isFullyBooked: false })]);
  });

  it('sums per-slot bookings and spotsLeft for the day', () => {
    const result = buildAvailabilityDays({
      slots: SLOTS,
      bookings: [
        { slotTimeId: 'slot-1', bookingDate: '2026-12-01', paxCount: 4 },
        { slotTimeId: 'slot-1', bookingDate: '2026-12-01', paxCount: 2 },
        { slotTimeId: 'slot-2', bookingDate: '2026-12-01', paxCount: 10 },
      ],
      blackoutDates: [],
      fulfillmentMode: 'SELF_DRIVE',
      from: '2026-12-01',
      to: '2026-12-01',
      now: NOW,
    });

    // slot-1: 6 taken → 4 free; slot-2: 10 taken → 0. One enabled slot remains.
    expect(result[0]).toEqual(day({ date: '2026-12-01', totalAvailable: 4, isFullyBooked: false }));
  });

  it('marks a date sold out when no slot passes the cutoff and 24h lead rules', () => {
    const result = buildAvailabilityDays({
      slots: SLOTS,
      bookings: [
        { slotTimeId: 'slot-1', bookingDate: '2026-12-01', paxCount: 10 },
        { slotTimeId: 'slot-2', bookingDate: '2026-12-01', paxCount: 10 },
      ],
      blackoutDates: [],
      fulfillmentMode: 'SELF_DRIVE',
      from: '2026-12-01',
      to: '2026-12-01',
      now: NOW,
    });

    expect(result[0]).toEqual(day({ date: '2026-12-01', totalAvailable: 0, isFullyBooked: true }));
  });

  it('does not let bookings on other days or slots inflate a date', () => {
    const result = buildAvailabilityDays({
      slots: SLOTS,
      bookings: [
        { slotTimeId: 'slot-1', bookingDate: '2026-12-02', paxCount: 10 },
        { slotTimeId: 'slot-99', bookingDate: '2026-12-01', paxCount: 10 },
        { slotTimeId: null, bookingDate: '2026-12-01', paxCount: 10 },
      ],
      blackoutDates: [],
      fulfillmentMode: 'SELF_DRIVE',
      from: '2026-12-01',
      to: '2026-12-01',
      now: NOW,
    });

    expect(result[0]).toEqual(day({ date: '2026-12-01', totalAvailable: 20, isFullyBooked: false }));
  });

  it('marks blackout dates closed, even with capacity', () => {
    const result = buildAvailabilityDays({
      slots: SLOTS,
      bookings: [],
      blackoutDates: ['2026-12-02'],
      fulfillmentMode: 'SELF_DRIVE',
      from: '2026-12-01',
      to: '2026-12-03',
      now: NOW,
    });

    expect(result[0]).toEqual(day({ date: '2026-12-01', totalAvailable: 20, isFullyBooked: false }));
    expect(result[1]).toEqual(day({ date: '2026-12-02', closed: true }));
    expect(result[2]).toEqual(day({ date: '2026-12-03', totalAvailable: 20, isFullyBooked: false }));
  });

  it('marks past dates with no enabled slot', () => {
    // '14:00' on an already-started day: fewer than the 24h lead time.
    const result = buildAvailabilityDays({
      slots: [{ id: 'slot-1', time: '12:00', maxCapacity: 10, cutoffHours: null }],
      bookings: [],
      blackoutDates: [],
      fulfillmentMode: 'SELF_DRIVE',
      from: '2026-11-20',
      to: '2026-11-20',
      now: NOW,
    });

    expect(result[0]).toEqual(day({ date: '2026-11-20', totalAvailable: 10, isFullyBooked: true }));
  });
});
