import type { Prisma } from '@prisma/client';
import type { AdminVentureWriteInput } from './adminVentureSchema';
import { buildVentureSlug } from './slug';

export { buildVentureSlug };

/**
 * Map the validated admin payload to Prisma columns. Tenant, slug uniqueness
 * and rating are handled by the route so create and edit stay consistent.
 */
export function ventureWriteData(input: AdminVentureWriteInput) {
  const gallery = Array.from(new Set(input.gallery.filter((url) => url !== input.imageUrl)));
  return {
    title: input.title,
    category: input.category,
    subcategory: input.subcategory || null,
    hook3Sec: input.hook3Sec,
    shortDescription: input.shortDescription || null,
    longDescription: input.longDescription || null,
    duration: input.duration,
    difficulty: input.difficulty,
    badge: input.badge || null,
    locationId: input.locationId || null,
    meetingPoint: input.meetingPoint || null,
    meetingPointLat: input.meetingPointLat ?? null,
    meetingPointLng: input.meetingPointLng ?? null,
    minAge: input.minAge ?? null,
    maxWeightKg: input.maxWeightKg ?? null,
    safetyBriefing: input.safetyBriefing || null,
    highlights: input.highlights as Prisma.InputJsonValue,
    inclusions: input.inclusions as Prisma.InputJsonValue,
    exclusions: input.exclusions as Prisma.InputJsonValue,
    languages: input.languages as Prisma.InputJsonValue,
    suitableFor: input.suitableFor as Prisma.InputJsonValue,
    itinerary: input.itinerary as Prisma.InputJsonValue,
    essentialInfo: input.essentialInfo as Prisma.InputJsonValue,
    faqs: input.faqs as Prisma.InputJsonValue,
    primaryKeyword: input.primaryKeyword || null,
    secondaryKeywords: input.secondaryKeywords as Prisma.InputJsonValue,
    searchTags: input.searchTags as Prisma.InputJsonValue,
    imageUrl: input.imageUrl,
    gallery: gallery as Prisma.InputJsonValue,
    videoUrl: input.videoUrl || null,
  };
}
