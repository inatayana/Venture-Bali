import { z } from 'zod';

export const PICKUP_ZONE_TYPES = ['ZONE_1', 'ZONE_2', 'ZONE_3', 'ZONE_4'] as const;

export const pickupZoneCreateSchema = z.object({
  name: z.string().trim().min(3, 'Zone name is too short').max(80, 'Zone name is too long'),
  areaType: z.enum(PICKUP_ZONE_TYPES),
  surchargeIdr: z.number().int().min(0, 'Surcharge cannot be negative').max(5_000_000),
  isCustomQuote: z.boolean().default(false),
  vehicleMaxPax: z.number().int().min(1).max(20).default(4),
  isActive: z.boolean().default(true),
});

export const pickupZoneUpdateSchema = pickupZoneCreateSchema.partial();

export type PickupZoneCreateInput = z.infer<typeof pickupZoneCreateSchema>;
export type PickupZoneUpdateInput = z.infer<typeof pickupZoneUpdateSchema>;
