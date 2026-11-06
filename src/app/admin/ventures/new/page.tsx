import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { isProductMediaConfigured } from '@/lib/productMedia';
import { VentureForm, type VentureFormLocation } from '@/components/admin/VentureForm';

export const dynamic = 'force-dynamic';

export default async function AdminNewVenturePage() {
  const locations: VentureFormLocation[] = await prisma.location.findMany({
    orderBy: [{ region: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      region: true,
      desa: true,
      kecamatan: true,
      kabupaten: true,
      provinsi: true,
    },
  });

  return (
    <div className="min-w-0 space-y-5">
      <Link href="/admin/ventures" className="inline-flex min-h-[44px] items-center text-sm text-brand-ink hover:underline">
        ← Ventures
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold text-gray-900">New product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create the product first, then add its first package (price, slots, pickup) from the
          product page.
        </p>
      </header>
      <VentureForm
        mode="create"
        locations={locations}
        mediaUploadEnabled={isProductMediaConfigured()}
      />
    </div>
  );
}
