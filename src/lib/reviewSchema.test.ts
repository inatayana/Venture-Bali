import { canReviewBooking, reviewBlockedReason, reviewInputSchema } from './reviewSchema';

const today = new Date('2026-11-15T10:00:00');

const base = {
  paymentStatus: 'PAID',
  bookingDate: '2026-11-10',
  reviewId: null as string | null,
  lifecycleStatus: 'COMPLETED',
};

describe('review input', () => {
  it('accepts a valid review', () => {
    const parsed = reviewInputSchema.safeParse({
      token: 'cl1.payload.signature',
      bookingId: 'bk-1',
      rating: 5,
      comment: 'The guide was brilliant and the river was perfect.',
    });

    expect(parsed.success).toBe(true);
  });

  it('accepts the optional display name and location', () => {
    const parsed = reviewInputSchema.safeParse({
      token: 'cl1.payload.signature',
      bookingId: 'bk-1',
      rating: 5,
      comment: 'The guide was brilliant and the river was perfect.',
      guestName: 'Nicholas',
      guestLocation: 'Woodbridge Township, NJ',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.guestName).toBe('Nicholas');
      expect(parsed.data.guestLocation).toBe('Woodbridge Township, NJ');
    }
  });

  it('rejects an overlong display location', () => {
    expect(
      reviewInputSchema.safeParse({
        token: 'cl1.payload.signature',
        bookingId: 'bk-1',
        rating: 5,
        comment: 'Great trip, would absolutely come back again.',
        guestLocation: 'x'.repeat(81),
      }).success
    ).toBe(false);
  });

  it('rejects ratings outside 1–5', () => {
    expect(
      reviewInputSchema.safeParse({
        token: 'cl1.payload.signature',
        bookingId: 'bk-1',
        rating: 6,
        comment: 'Great trip, would absolutely come back again.',
      }).success
    ).toBe(false);
  });

  it('rejects short comments', () => {
    expect(
      reviewInputSchema.safeParse({
        token: 'cl1.payload.signature',
        bookingId: 'bk-1',
        rating: 4,
        comment: 'Nice',
      }).success
    ).toBe(false);
  });
});

describe('canReviewBooking', () => {
  it('allows a paid trip that already happened', () => {
    expect(canReviewBooking(base, today)).toBe(true);
  });

  it('blocks unpaid bookings', () => {
    expect(canReviewBooking({ ...base, paymentStatus: 'PENDING' }, today)).toBe(false);
  });

  it('blocks future trips', () => {
    expect(canReviewBooking({ ...base, bookingDate: '2026-11-20' }, today)).toBe(false);
  });

  it('blocks a second review for the same booking', () => {
    expect(canReviewBooking({ ...base, reviewId: 'rev-1' }, today)).toBe(false);
  });

  it('only allows completed trips', () => {
    expect(canReviewBooking({ ...base, lifecycleStatus: 'CONFIRMED' }, today)).toBe(false);
    expect(canReviewBooking({ ...base, lifecycleStatus: 'CANCELLED' }, today)).toBe(false);
    expect(canReviewBooking({ ...base, lifecycleStatus: 'NO_SHOW' }, today)).toBe(false);
  });

  it('keeps the lifecycle optional for legacy callers', () => {
    expect(canReviewBooking({ ...base, lifecycleStatus: undefined }, today)).toBe(true);
  });

  it('explains why a booking cannot be reviewed', () => {
    expect(reviewBlockedReason({ ...base, reviewId: 'rev-1' }, today)).toMatch(/already reviewed/i);
    expect(reviewBlockedReason({ ...base, bookingDate: '2026-12-01' }, today)).toMatch(
      /after the activity day/i
    );
    expect(reviewBlockedReason({ ...base, paymentStatus: 'PENDING' }, today)).toMatch(/not paid/i);
    expect(reviewBlockedReason({ ...base, lifecycleStatus: 'CONFIRMED' }, today)).toMatch(
      /marked complete/i
    );
    expect(reviewBlockedReason({ ...base, lifecycleStatus: 'NO_SHOW' }, today)).toMatch(/no-show/i);
    expect(reviewBlockedReason(base, today)).toBeNull();
  });
});
