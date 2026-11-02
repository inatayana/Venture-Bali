import { z } from 'zod';
import { COUNTRIES } from './countries';
import { reviewInputSchema } from './reviewSchema';

const COUNTRY_CODES = new Set(COUNTRIES.map((country) => country.code));

/** Founding-guest review payload. The signed invite link is the authorisation. */
export const inviteReviewInputSchema = reviewInputSchema
  .omit({ bookingId: true, guestLocation: true })
  .extend({
    inviteId: z.string().min(1, 'Missing invite'),
    guestName: z
      .string()
      .trim()
      .min(2, 'Enter the name you want shown with your review.')
      .max(60, 'Keep your name under 60 characters'),
    guestCountryCode: z
      .string()
      .trim()
      .toUpperCase()
      .refine((code) => COUNTRY_CODES.has(code), 'Choose your country'),
  });

export type InviteReviewInput = z.infer<typeof inviteReviewInputSchema>;
