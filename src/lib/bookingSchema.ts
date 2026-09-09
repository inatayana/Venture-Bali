import { z } from 'zod';

export const bookingSchema = z.object({
  ventureId: z.string().min(1, 'Venture ID is required'),
  variantId: z.string().min(1, 'Variant ID is required'),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Booking date must be YYYY-MM-DD'),
  slotTimeId: z.string().min(1, 'Time slot ID is required'),
  fulfillmentMode: z.enum(['SELF_DRIVE', 'PRIVATE_TRANSFER']),
  pickupZoneId: z.string().optional(),
  vehicleClassType: z.enum(['STANDARD_SUV', 'PREMIUM_MPV', 'MINIVAN']).optional(),
  hotelAddress: z.string().trim().max(500).optional(),
  paxCount: z.number().int().min(1, 'At least 1 participant required'),
  selectedAddons: z.array(z.string()).default([]),
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  customerEmail: z.string().trim().email('Invalid email format').max(320),
  customerWhatsApp: z.string().trim().min(10, 'WhatsApp number required').max(32),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/, 'Country code must be a two-letter ISO code').default('ID'),
});

export type BookingInput = z.infer<typeof bookingSchema>;
