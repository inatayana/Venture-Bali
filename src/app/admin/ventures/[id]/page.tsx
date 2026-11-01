import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { VariantOperationsEditor } from '@/components/admin/VariantOperationsEditor';
import { VariantPackageEditor } from '@/components/admin/VariantPackageEditor';

export const dynamic = 'force-dynamic';

interface AdminVentureDetailPageProps {
  params: { id: string };
}

function asStringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

export default async function AdminVentureDetailPage({ params }: AdminVentureDetailPageProps) {
  const [venture, zones] = await Promise.all([
    prisma.venture.findUnique({
      where: { id: params.id },
      include: {
        variants: {
          orderBy: { sortOrder: 'asc' },
          include: {
            slotTimes: { orderBy: { time: 'asc' } },
            addons: { orderBy: { name: 'asc' } },
            priceTiers: { orderBy: { minPax: 'asc' } },
            pickupZone: { select: { name: true } },
            _count: { select: { bookings: true } },
          },
        },
      },
    }),
    prisma.pickupZone.findMany({
      where: { isActive: true },
      orderBy: { areaType: 'asc' },
      select: { id: true, name: true, surchargeIdr: true, isCustomQuote: true },
    }),
  ]);

  if (!venture) notFound();

  return (
    <div className="space-y-5">
      <Link href="/admin/ventures" className="text-sm text-brand-ink hover:underline">
        ← Ventures
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">{venture.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {venture.category} · {venture.duration} · {venture.variants.length} packages ·{' '}
            {venture.variants.reduce((sum, variant) => sum + variant._count.bookings, 0)} bookings
          </p>
        </div>
        <VariantPackageEditor ventureId={venture.id} zones={zones} />
      </header>

      <div className="space-y-4">
        {venture.variants.map((variant) => (
          <VariantOperationsEditor
            key={variant.id}
            variant={{
              id: variant.id,
              title: variant.title,
              fulfillmentMode: variant.fulfillmentMode,
              pickupZoneName: variant.pickupZone?.name ?? null,
              blackoutDates: asStringArray(variant.blackoutDates),
              addons: variant.addons.map((addon) => ({
                id: addon.id,
                name: addon.name,
                price: addon.price,
                requiresTransfer: addon.requiresTransfer,
                isCombo: addon.isCombo,
              })),
              slotTimes: variant.slotTimes.map((slot) => ({
                id: slot.id,
                time: slot.time,
                maxCapacity: slot.maxCapacity,
                currentBookings: slot.currentBookings,
                isAvailable: slot.isAvailable,
              })),
            }}
            headerAction={
              <VariantPackageEditor
                ventureId={venture.id}
                zones={zones}
                variant={{
                  id: variant.id,
                  title: variant.title,
                  shortDescription: variant.shortDescription,
                  fulfillmentMode: variant.fulfillmentMode,
                  pickupZoneId: variant.pickupZoneId,
                  duration: variant.duration,
                  badge: variant.badge,
                  transportBadge: variant.transportBadge,
                  minimumSpendIdr: variant.minimumSpendIdr,
                  sortOrder: variant.sortOrder,
                  priceTiers: variant.priceTiers.map((tier) => ({
                    minPax: tier.minPax,
                    maxPax: tier.maxPax,
                    pricePerPax: tier.pricePerPax,
                  })),
                  bookingCount: variant._count.bookings,
                }}
              />
            }
          />
        ))}
      </div>
    </div>
  );
}
