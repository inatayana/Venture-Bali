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
