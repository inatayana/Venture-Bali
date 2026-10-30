import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { mockExperiences } from '@/data/mockExperiences';
import { mockPickupZones, mockVehicleClasses } from '@/data/mockExperiences';
import {
  toVentureItem,
  ventureWithRelations,
} from '@/lib/ventureMapper';
import {
  generateVentureMetadata,
  generateVentureStructuredData,
  getBaseUrl,
} from '@/lib/seo';
import { ExperienceDetailClient } from './ExperienceDetailClient';
import type { PickupZone, VehicleClass, VentureItem } from '@/types/venture';

interface PageProps {
  params: { id: string; slug: string };
}

interface BookingOptions {
  zones: PickupZone[];
  vehicleClasses: VehicleClass[];
}

async function getExperience(id: string, slug: string): Promise<VentureItem | null> {
  try {
    const venture = await prisma.venture.findFirst({
      where: { OR: [{ id }, { slug }] },
      include: ventureWithRelations,
    });
    return venture ? toVentureItem(venture) : null;
  } catch (error) {
    console.error('Prisma query failed, falling back to mock data:', error);
    return mockExperiences.find((v) => v.id === id || v.slug === slug) ?? null;
  }
}

/**
 * Pickup zones and vehicle classes come from the database now.
 * The widget used to ship mock zone ids ("zone-1") that the booking service
 * rejected, which broke every transfer booking.
 */
async function getBookingOptions(): Promise<BookingOptions> {
  try {
    const [zones, vehicleClasses] = await Promise.all([
      prisma.pickupZone.findMany({
        where: { isActive: true },
        orderBy: { areaType: 'asc' },
      }),
      prisma.vehicleClass.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    return {
      zones: zones.length > 0 ? zones : mockPickupZones,
      vehicleClasses:
        vehicleClasses.length > 0
          ? vehicleClasses.map((item) => ({ ...item, description: item.description ?? undefined }))
          : mockVehicleClasses,
    };
  } catch (error) {
    console.error('Could not load pickup options, falling back to mock data:', error);
    return { zones: mockPickupZones, vehicleClasses: mockVehicleClasses };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const venture = await getExperience(params.id, params.slug);

  if (!venture) {
    return {
      title: 'Experience Not Found | Venture Bali',
      description: 'The requested experience could not be found.',
    };
  }

  return generateVentureMetadata({ venture, baseUrl: getBaseUrl() });
}

export default async function ExperienceDetailPage({ params }: PageProps) {
  const [venture, bookingOptions] = await Promise.all([
    getExperience(params.id, params.slug),
    getBookingOptions(),
  ]);

  if (!venture) {
    notFound();
  }

  const structuredData = generateVentureStructuredData({
    venture,
    baseUrl: getBaseUrl(),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ExperienceDetailClient
        venture={venture}
        zones={bookingOptions.zones}
        vehicleClasses={bookingOptions.vehicleClasses}
      />
    </>
  );
}
