import { assessReviewForPublishing } from './reviewModeration';

const clean = {
  rating: 5,
  comment: 'The guide was brilliant, the river was clean and the lunch was excellent.',
  verifiedBooking: true,
};

describe('review moderation', () => {
  it('auto-publishes a clean verified 4-5 star review', () => {
    expect(assessReviewForPublishing(clean)).toEqual({
      autoPublish: true,
      reason: 'clean-verified-review',
    });
    expect(assessReviewForPublishing({ ...clean, rating: 4 }).autoPublish).toBe(true);
  });

  it('keeps low ratings for a human', () => {
    expect(assessReviewForPublishing({ ...clean, rating: 3 })).toEqual({
      autoPublish: false,
      reason: 'low-rating',
    });
  });

  it('never auto-publishes an unverified review', () => {
    expect(assessReviewForPublishing({ ...clean, verifiedBooking: false }).autoPublish).toBe(false);
  });

  it('holds reviews containing links, emails or phone numbers', () => {
    expect(
      assessReviewForPublishing({
        ...clean,
        comment: 'Great trip, book again at https://example.com or wa.me/628123456789.',
      }).reason
    ).toBe('contact-details');
    expect(
      assessReviewForPublishing({
        ...clean,
        comment: 'Contact me at guide@example.com for a private tour next time.',
      }).reason
    ).toBe('contact-details');
  });

  it('holds profanity for a human', () => {
    expect(
      assessReviewForPublishing({
        ...clean,
        comment: 'The guide was fucking brilliant and the river was perfect.',
      }).reason
    ).toBe('profanity');
  });

  it('holds comments that are too short', () => {
    expect(assessReviewForPublishing({ ...clean, comment: 'Amazing trip!' }).reason).toBe('too-short');
  });
});
