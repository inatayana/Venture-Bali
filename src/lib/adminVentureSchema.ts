import { z } from 'zod';

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

