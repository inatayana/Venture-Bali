import { z } from 'zod';
import { isAllowedCategory, resolveCategory } from './taxonomy';
import { TITLE_MAX_LENGTH, TITLE_MIN_LENGTH } from './titleValidator';

/** Normalise "8:00am" / "08:00 am" / "8:00 AM" to the display format "08:00 AM". */
export function normaliseSlotTime(value: string): string {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, ' ');
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
  if (!match) return value.trim();

  const [, hour, minutes, meridiem] = match;
  return `${hour.padStart(2, '0')}:${minutes} ${meridiem}`;
}

export const slotInputSchema = z.object({
  time: z
    .string()
    .trim()
    .regex(/^\d{1,2}:\d{2}\s?(AM|PM)$/i, 'Use a time like 08:00 AM')
    .transform(normaliseSlotTime),
  maxCapacity: z.number().int().min(1, 'Capacity must be at least 1').max(100, 'Capacity is too large'),
  isAvailable: z.boolean().default(true),
});

export const slotUpdateSchema = z.object({
  time: z
    .string()
    .trim()
    .regex(/^\d{1,2}:\d{2}\s?(AM|PM)$/i, 'Use a time like 08:00 AM')
    .transform(normaliseSlotTime)
    .optional(),
  maxCapacity: z.number().int().min(1).max(100).optional(),
  isAvailable: z.boolean().optional(),
});

export const blackoutInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
});

export const addonInputSchema = z.object({
  name: z.string().trim().min(3, 'Add-on name is too short').max(80),
  price: z.number().int().min(0, 'Price cannot be negative').max(20_000_000),
  description: z.string().trim().max(200).optional(),
  requiresTransfer: z.boolean().default(false),
  isCombo: z.boolean().default(false),
});

export const addonUpdateSchema = addonInputSchema.partial();

/** One price tier for a package (variant). */
export const variantPriceTierSchema = z
  .object({
    minPax: z.number().int().min(1, 'Minimum pax is 1').max(99),
    maxPax: z.number().int().min(1).max(99),
    pricePerPax: z.number().int().min(0, 'Price cannot be negative').max(50_000_000),
  })
  .refine((tier) => tier.maxPax >= tier.minPax, {
    message: 'Max pax must be at least min pax',
    path: ['maxPax'],
  });

const assetUrlSchema = z
  .string()
  .trim()
  .min(1, 'An image is required')
  .max(500)
  .refine(
    (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
    'Use a /images/... path or an https:// URL',
  );

const variantBaseSchema = z.object({
  title: z.string().trim().min(3, 'Title is too short').max(80, 'Title is too long'),
  shortDescription: z
    .string()
    .trim()
    .min(10, 'Description is too short')
    .max(280, 'Description is too long'),
  fulfillmentMode: z.enum(['SELF_DRIVE', 'SHARED_TRANSFER', 'PRIVATE_TRANSFER']),
  /** Zone-locked pickup area; ignored for self-drive packages. */
  pickupZoneId: z.string().trim().min(1).nullable().optional(),
  duration: z.string().trim().max(40).optional(),
  badge: z.string().trim().max(40).nullable().optional(),
  transportBadge: z.string().trim().max(40).nullable().optional(),
  minimumSpendIdr: z.number().int().min(0).max(50_000_000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
  priceTiers: z
    .array(variantPriceTierSchema)
    .min(1, 'Add at least one price tier')
    .max(10, 'Too many price tiers'),
  /** Optional cover: reuses one of the product's photos (no variant gallery). */
  imageUrl: assetUrlSchema.nullable().optional(),
});

function checkTiersDoNotOverlap(
  tiers: readonly { minPax: number; maxPax: number }[],
  ctx: z.RefinementCtx,
) {
  const sorted = [...tiers].sort((a, b) => a.minPax - b.minPax);
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].minPax <= sorted[index - 1].maxPax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['priceTiers'],
        message: 'Price tiers must not overlap',
      });
      return;
    }
  }
}

export const adminVariantSchema = variantBaseSchema.superRefine((value, ctx) => {
  if (value.fulfillmentMode === 'SELF_DRIVE' && value.pickupZoneId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pickupZoneId'],
      message: 'Self-drive packages do not use a pickup zone',
    });
  }
  checkTiersDoNotOverlap(value.priceTiers, ctx);
});

export const adminVariantUpdateSchema = variantBaseSchema.partial().superRefine((value, ctx) => {
  if (value.priceTiers) checkTiersDoNotOverlap(value.priceTiers, ctx);
});

/**
 * Product (venture) write schema shared by create and edit.
 *
 * Covers the fields an operator can safely edit. Rating is derived from real
 * reviews, tenant is resolved by the route, and variants are managed on their
 * own endpoint.
 */

const textListSchema = z.array(z.string().trim().min(1).max(200)).max(20);

const itinerarySchema = z
  .array(
    z.object({
      time: z.string().trim().min(1).max(20),
      activity: z.string().trim().min(1).max(200),
      duration: z.string().trim().max(40).optional(),
      durationMinutes: z.number().int().min(0).max(1440).optional(),
    }),
  )
  .max(20);

const faqSchema = z
  .array(
    z.object({
      question: z.string().trim().min(3).max(200),
      answer: z.string().trim().min(3).max(2000),
    }),
  )
  .max(20);

const essentialInfoSchema = z.object({
  perfectFor: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  whatToBring: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  knowBeforeYouGo: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
});

export const adminVentureWriteSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(TITLE_MIN_LENGTH, `Title must be at least ${TITLE_MIN_LENGTH} characters`)
      .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`),
    /** Optional: generated from the title when omitted. */
    slug: z
      .string()
      .trim()
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens')
      .optional(),
    category: z
      .string()
      .trim()
      .refine(isAllowedCategory, 'Choose one of the 9 adventure categories')
      .transform((value) => resolveCategory(value)?.canonical ?? value),
    subcategory: z.string().trim().max(60).optional(),
    hook3Sec: z.string().trim().min(10, 'Hook is too short').max(120),
    shortDescription: z.string().trim().max(200).optional(),
    longDescription: z.string().trim().max(8000).optional(),
    duration: z.string().trim().min(3).max(40),
    difficulty: z.enum(['EASY', 'MODERATE', 'CHALLENGING']).default('EASY'),
    badge: z.string().trim().max(30).optional(),
    locationId: z.string().trim().min(1).nullable().optional(),
    meetingPoint: z.string().trim().max(200).optional(),
    meetingPointLat: z.number().min(-90).max(90).optional(),
    meetingPointLng: z.number().min(-180).max(180).optional(),
    minAge: z.number().int().min(0).max(100).optional(),
    maxWeightKg: z.number().int().min(20).max(300).optional(),
    safetyBriefing: z.string().trim().max(2000).optional(),
    highlights: textListSchema.default([]),
    inclusions: textListSchema.default([]),
    exclusions: textListSchema.default([]),
    languages: z.array(z.string().trim().min(2).max(5)).max(6).default(['en', 'id']),
    suitableFor: z
      .array(z.enum(['KIDS', 'COUPLE', 'FAMILY', 'SOLO', 'GROUP']))
      .max(5, 'Choose up to 5 suitable groups')
      .default([]),
    itinerary: itinerarySchema.default([]),
    essentialInfo: essentialInfoSchema.default({
      perfectFor: [],
      whatToBring: [],
      knowBeforeYouGo: [],
    }),
    faqs: faqSchema.default([]),
    primaryKeyword: z.string().trim().max(80).optional(),
    secondaryKeywords: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
    searchTags: z.array(z.string().trim().min(1).max(60)).max(15).default([]),
    imageUrl: assetUrlSchema,
    gallery: z
      .array(assetUrlSchema)
      .max(6, 'Add at most 6 gallery photos — 1 main cover + 6 itinerary photos per product')
      .default([]),
    videoUrl: z
      .string()
      .trim()
      .max(500)
      .refine(
        (value) => value === '' || /^https?:\/\//i.test(value),
        'Use an https:// video URL',
      )
      .optional(),
  })
  .superRefine((value, ctx) => {
    const hasMeetingPointName = Boolean(value.meetingPoint);
    const hasCoordinates =
      value.meetingPointLat !== undefined && value.meetingPointLng !== undefined;
    if (hasMeetingPointName && !hasCoordinates) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['meetingPoint'],
        message: 'Add the meeting point latitude and longitude',
      });
    }
    if (hasCoordinates && !hasMeetingPointName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['meetingPoint'],
        message: 'Add the meeting point name',
      });
    }
  });

export type AdminVentureWriteInput = z.infer<typeof adminVentureWriteSchema>;

