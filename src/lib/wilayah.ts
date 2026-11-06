import raw from '@/data/wilayah-bali.json';

export interface WilayahDistrict {
  id: string;
  name: string;
  villages: string[];
}

export interface WilayahRegency {
  id: string;
  name: string;
  districts: WilayahDistrict[];
}

interface WilayahDataset {
  province: string;
  source: string;
  regencies: WilayahRegency[];
}

/**
 * Bali administrative areas, vendored from the Kemendagri dataset
 * (emsifa/api-wilayah-indonesia, fetched 2026-11-04) so the admin area
 * cascade never depends on a network call. Bali-only for now — the
 * province list grows by editing src/data/wilayah-bali.json.
 */
export const WILAYAH_DATASET = raw as unknown as WilayahDataset;

/** Province preselected in the admin area cascade. */
export const PROVINSI_DEFAULT = WILAYAH_DATASET.province;

/**
 * Case/space-insensitive comparison so stored legacy values such as
 * "Karangasem" match the official "Karang Asem" spelling.
 */
export function normalizeAreaName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

/** Official kabupaten/kota names, alphabetically sorted. */
export function getRegencies(): string[] {
  return WILAYAH_DATASET.regencies
    .map((regency) => regency.name)
    .sort((a, b) => a.localeCompare(b));
}

/** Resolve free text (DB value, legacy region, …) to an official name. */
export function findRegencyName(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const target = normalizeAreaName(input);
  return (
    WILAYAH_DATASET.regencies.find((regency) => normalizeAreaName(regency.name) === target)?.name ??
    null
  );
}

/** Official kecamatan names for one kabupaten/kota. */
export function getDistricts(kabupaten: string): string[] {
  const regency = WILAYAH_DATASET.regencies.find(
    (item) => item.name === findRegencyName(kabupaten)
  );
  return regency ? regency.districts.map((district) => district.name).sort() : [];
}

/** Resolve free text to an official kecamatan name within a kabupaten. */
export function findDistrictName(
  kabupaten: string,
  input: string | null | undefined
): string | null {
  if (!input?.trim()) return null;
  const target = normalizeAreaName(input);
  const regency = WILAYAH_DATASET.regencies.find(
    (item) => item.name === findRegencyName(kabupaten)
  );
  return (
    regency?.districts.find((district) => normalizeAreaName(district.name) === target)?.name ?? null
  );
}

/** Official desa/kelurahan names for one kecamatan (small list after cascade). */
export function getVillages(kabupaten: string, kecamatan: string): string[] {
  const regency = WILAYAH_DATASET.regencies.find(
    (item) => item.name === findRegencyName(kabupaten)
  );
  const district = regency?.districts.find(
    (item) => item.name === findDistrictName(kabupaten, kecamatan)
  );
  return district ? [...district.villages].sort((a, b) => a.localeCompare(b)) : [];
}

/** True when the desa exists in the official list for that kecamatan. */
export function isKnownVillage(kabupaten: string, kecamatan: string, desa: string): boolean {
  return getVillages(kabupaten, kecamatan).includes(desa);
}
