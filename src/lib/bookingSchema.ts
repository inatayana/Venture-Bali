import { z } from 'zod';

export const billingAddressSchema = z.object({
  name: z.string().trim().min(2, 'Billing name is required').max(120),
  street: z.string().trim().min(4, 'Billing street is required').max(200),
  city: z.string().trim().min(2, 'Billing city is required').max(120),
  province: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().min(3, 'Postal code is required').max(12),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/, 'Country code must be a two-letter ISO code').default('ID'),
});

export const bookingSchema = z
  .object({
    ventureId: z.string().min(1, 'Venture ID is required'),
    variantId: z.string().min(1, 'Variant ID is required'),
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Booking date must be YYYY-MM-DD'),
    slotTimeId: z.string().min(1, 'Time slot ID is required'),
    fulfillmentMode: z.enum(['SELF_DRIVE', 'SHARED_TRANSFER', 'PRIVATE_TRANSFER']),
    pickupZoneId: z.string().optional(),
    vehicleClassType: z.enum(['STANDARD_SUV', 'PREMIUM_MPV', 'MINIVAN']).optional(),
    hotelAddress: z.string().trim().max(500).optional(),
    isTba: z.boolean().default(false),
    couponCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,24}$/, 'Invalid coupon code')
      .optional(),
    paxCount: z.number().int().min(1, 'At least 1 participant required').max(10, 'Maximum 10 guests per booking'),
    selectedAddons: z.array(z.string()).default([]),
    customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    customerEmail: z.string().trim().email('Invalid email format').max(320),
    customerWhatsApp: z.string().trim().min(10, 'WhatsApp number required').max(32),
    countryCode: z.string().trim().regex(/^[A-Z]{2}$/, 'Country code must be a two-letter ISO code').default('ID'),
    billingAddress: billingAddressSchema,
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the booking terms' }),
    }),
    waiverAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the activity safety waiver' }),
    }),
  })
  .superRefine((value, ctx) => {
    const needsPickup = value.fulfillmentMode !== 'SELF_DRIVE';

    if (needsPickup && !value.pickupZoneId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pickupZoneId'],
        message: 'Pickup area is required for a transfer booking',
      });
    }

    if (needsPickup && !value.isTba && !value.hotelAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hotelAddress'],
        message: 'Hotel or villa address is required, or mark it as TBA',
      });
    }

    if (value.fulfillmentMode === 'SHARED_TRANSFER' && value.vehicleClassType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vehicleClassType'],
        message: 'Shared transfer does not use a private vehicle class',
      });
    }

    if (value.fulfillmentMode === 'PRIVATE_TRANSFER' && !value.vehicleClassType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vehicleClassType'],
        message: 'Vehicle class is required for a private transfer',
      });
    }
  });

export type BookingInput = z.infer<typeof bookingSchema>;
