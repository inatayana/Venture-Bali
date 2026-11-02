import { inviteReviewInputSchema } from './reviewInviteSchema';

describe('founding guest review input', () => {
  const base = {
    token: 'ri1.payload.signature',
    inviteId: 'invite-1',
    rating: 5,
    comment: 'The guide was brilliant and the canyon was even better than the photos.',
    guestName: 'Camille Laurent',
    guestCountryCode: 'fr',
  };

  it('normalises the country code', () => {
    const parsed = inviteReviewInputSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.guestCountryCode).toBe('FR');
  });

  it('requires a display name and a valid country', () => {
    expect(inviteReviewInputSchema.safeParse({ ...base, guestName: '' }).success).toBe(false);
    expect(inviteReviewInputSchema.safeParse({ ...base, guestCountryCode: 'XX' }).success).toBe(false);
  });

  it('keeps the 500 character cap', () => {
    expect(
      inviteReviewInputSchema.safeParse({ ...base, comment: 'a'.repeat(501) }).success
    ).toBe(false);
  });
});
