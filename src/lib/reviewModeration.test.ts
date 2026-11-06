import { assessReviewForPublishing } from './reviewModeration';

const base = {
  rating: 5,
  comment: 'The guide was brilliant, the river was clean and the lunch was excellent.',
  verifiedBooking: true,
};

describe('review moderation policy', () => {
  it('publishes verified reviews immediately', () => {
    expect(assessReviewForPublishing(base)).toEqual({
      autoPublish: true,
      reason: 'auto-published',
    });
  });

  it('publishes low ratings immediately', () => {
    expect(assessReviewForPublishing({ ...base, rating: 1 }).autoPublish).toBe(true);
  });

  it('publishes reviews with photos immediately', () => {
    expect(assessReviewForPublishing({ ...base, photoCount: 3 }).autoPublish).toBe(true);
  });

  it('publishes founding-guest reviews that are not tied to a booking', () => {
    expect(assessReviewForPublishing({ ...base, verifiedBooking: false }).autoPublish).toBe(true);
  });

  it('publishes comments containing links or contact details', () => {
    expect(
      assessReviewForPublishing({
        ...base,
        comment: 'Great trip, book again at https://example.com or wa.me/628123456789.',
      }).autoPublish
    ).toBe(true);
  });

  it('publishes short comments', () => {
    expect(assessReviewForPublishing({ ...base, comment: 'Amazing trip!' }).autoPublish).toBe(true);
  });
});
