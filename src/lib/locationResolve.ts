import { prisma } from '@/lib/prisma';

export interface AdminAreaInput {
  desa?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
}

export type LocationResolution =
  | { id: string | null }
  | { error: 'INVALID_LOCATION' | 'INCOMPLETE_AREA'; message: string };

/**
 * Resolve the admin area cascade (desa → kecamatan → kabupaten → provinsi)
 * to a Location id.
 *
 * When the full hierarchy is sent, an existing row is reused — first by the
 * hierarchy itself, then by the legacy composed name so old seeded rows are
 * adopted and their empty hierarchy backfilled instead of duplicated.
 * Otherwise the explicit locationId (legacy clients) is validated, and no
 * area at all stays allowed — Location is optional on a venture.
 *
 * The composed name keeps the "Desa, Kecamatan, Kabupaten, Provinsi" format:
 * VentureCard, the PDP fallback and the JSON-LD address parser (seo.ts) all
 * read it.
 */
export async function resolveLocationId(
  locationId: string | null | undefined,
  area: AdminAreaInput
): Promise<LocationResolution> {
  const desa = area.desa?.trim() || null;
  const kecamatan = area.kecamatan?.trim() || null;
  const kabupaten = area.kabupaten?.trim() || null;
  const provinsi = area.provinsi?.trim() || 'Bali';

  if (desa && kecamatan && kabupaten) {
    const byArea = await prisma.location.findFirst({
      where: { desa, kecamatan, kabupaten, provinsi },
      select: { id: true },
    });
    if (byArea) return byArea;

    const name = `${desa}, ${kecamatan}, ${kabupaten}, ${provinsi}`;
    const byName = await prisma.location.findFirst({ where: { name }, select: { id: true } });
    if (byName) {
      // Adopt the legacy row and heal its empty hierarchy in place.
      const healed = await prisma.location.update({
        where: { id: byName.id },
        data: { desa, kecamatan, kabupaten, provinsi, region: kabupaten },
        select: { id: true },
      });
      return healed;
    }

    const created = await prisma.location.create({
      data: {
        name,
        region: kabupaten,
        desa,
        kecamatan,
        kabupaten,
        provinsi,
      },
      select: { id: true },
    });
    return created;
  }

  if (locationId) {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true },
    });
    if (!location) {
      return { error: 'INVALID_LOCATION', message: 'Location not found' };
    }
    return location;
  }

  return { id: null };
}
