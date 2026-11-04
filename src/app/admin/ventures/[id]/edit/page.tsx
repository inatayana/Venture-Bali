import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isProductMediaConfigured } from '@/lib/productMedia';
import { normaliseSuitableFor } from '@/lib/ventureSuitableFor';
import {
  VentureForm,
  type VentureFormInitial,
  type VentureFormLocation,
} from '@/components/admin/VentureForm';

export const dynamic = 'force-dynamic';

interface AdminEditVenturePageProps {
  params: { id: string };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asItinerary(value: unknown): VentureFormInitial['itinerary'] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      time: typeof item.time === 'string' ? item.time : '',
      activity: typeof item.activity === 'string' ? item.activity : '',
      duration: typeof item.duration === 'string' ? item.duration : '',
      durationMinutes: typeof item.durationMinutes === 'number' ? item.durationMinutes : null,
    }))
    .filter((item) => item.time || item.activity);
}

function asEssentialInfo(value: unknown): VentureFormInitial['essentialInfo'] {
  if (typeof value !== 'object' || value === null) {
    return { perfectFor: [], whatToBring: [], knowBeforeYouGo: [] };
  }
  const record = value as Record<string, unknown>;
  return {
    perfectFor: asStringArray(record.perfectFor),
    whatToBring: asStringArray(record.whatToBring),
    knowBeforeYouGo: asStringArray(record.knowBeforeYouGo),
  };
}

function asFaqs(value: unknown): VentureFormInitial['faqs'] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      question: typeof item.question === 'string' ? item.question : '',
      answer: typeof item.answer === 'string' ? item.answer : '',
    }))
    .filter((item) => item.question || item.answer);
}


export default async function AdminEditVenturePage({ params }: AdminEditVenturePageProps) {
  const [venture, locations] = await Promise.all([
    prisma.venture.findUnique({ where: { id: params.id } }),
    prisma.location.findMany({
      orderBy: [{ region: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, region: true, desa: true, kecamatan: true, kabupaten: true, provinsi: true },
    }),
  ]);

  if (!venture) notFound();

  const initial: VentureFormInitial = {
    title: venture.title,
    slug: venture.slug,
    category: venture.category,
    subcategory: venture.subcategory ?? '',
    hook3Sec: venture.hook3Sec,
    shortDescription: venture.shortDescription ?? '',
    longDescription: venture.longDescription ?? '',
    duration: venture.duration,
    difficulty: venture.difficulty,
    badge: venture.badge ?? '',
    locationId: venture.locationId ?? '',
    meetingPoint: venture.meetingPoint ?? '',
    meetingPointLat: venture.meetingPointLat,
    meetingPointLng: venture.meetingPointLng,
    minAge: venture.minAge,
    maxWeightKg: venture.maxWeightKg,
    safetyBriefing: venture.safetyBriefing ?? '',
    highlights: asStringArray(venture.highlights),
    inclusions: asStringArray(venture.inclusions),
    exclusions: asStringArray(venture.exclusions),
    languages: asStringArray(venture.languages),
    suitableFor: normaliseSuitableFor(venture.suitableFor),
    itinerary: asItinerary(venture.itinerary),
    essentialInfo: asEssentialInfo(venture.essentialInfo),
    faqs: asFaqs(venture.faqs),
    primaryKeyword: venture.primaryKeyword ?? '',
    secondaryKeywords: asStringArray(venture.secondaryKeywords),
    searchTags: asStringArray(venture.searchTags),
    imageUrl: venture.imageUrl,
    gallery: asStringArray(venture.gallery),
    videoUrl: venture.videoUrl ?? '',
  };

  const locationRows: VentureFormLocation[] = locations;

  return (
    <div className="min-w-0 space-y-5">
      <Link href={`/admin/ventures/${venture.id}`} className="inline-flex min-h-[44px] items-center text-sm text-brand-ink hover:underline">
        ← {venture.title}
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Edit product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Core product details and media. Packages, prices and slots stay on the product page.
        </p>
      </header>
      <VentureForm
        mode="edit"
        ventureId={venture.id}
        initial={initial}
        locations={locationRows}
        mediaUploadEnabled={isProductMediaConfigured()}
      />
    </div>
  );
}
