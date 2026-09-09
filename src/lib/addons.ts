import type { Addon } from '@/types/venture';

export interface NormalizeAddonsOptions {
  variantId?: string;
}

type UnknownRecord = Record<string, unknown>;

const WRAPPER_KEYS = ['addons', 'items', 'data'] as const;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function toPrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

function toFallbackId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'addon';
}

function toAddon(entry: unknown, fallbackVariantId: string, fallbackIndex: number): Addon | null {
  if (typeof entry === 'string') {
    return toAddon(parseJson(entry), fallbackVariantId, fallbackIndex);
  }
  if (!isRecord(entry)) return null;

  const name = typeof entry.name === 'string' && entry.name.trim() !== '' ? entry.name.trim() : null;
  if (!name) return null;

  const price = toPrice(entry.price);
  if (price === null) return null;

  const id = typeof entry.id === 'string' && entry.id !== '' ? entry.id : toFallbackId(name);
  const variantId =
    typeof entry.variantId === 'string' && entry.variantId !== '' ? entry.variantId : fallbackVariantId;

  return {
    id,
    variantId,
    name,
    price,
    description: typeof entry.description === 'string' ? entry.description : undefined,
    requiresTransfer: entry.requiresTransfer === true,
    isCombo: entry.isCombo === true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function hasAddonShape(record: UnknownRecord): boolean {
  return record.name !== undefined || record.price !== undefined;
}

function getWrappedValue(record: UnknownRecord): unknown {
  for (const key of WRAPPER_KEYS) {
    if (key in record) return record[key];
  }
  return undefined;
}

/**
 * Normalize raw addon data into Addon[] regardless of source format.
 * Handles: Array, single Object, { addons: [...] } wrapper, keyed record map,
 * JSON string (array or object), and null/undefined. Invalid entries are dropped.
 */
export function normalizeAddons(input: unknown, options: NormalizeAddonsOptions = {}): Addon[] {
  const fallbackVariantId = options.variantId ?? '';
  let data: unknown = input;

  if (typeof data === 'string') {
    data = parseJson(data);
  }

  if (data === null || data === undefined) {
    return [];
  }

  if (Array.isArray(data)) {
    const seen = new Set<string>();
    const result: Addon[] = [];
    data.forEach((entry, index) => {
      const addon = toAddon(entry, fallbackVariantId, index);
      if (addon && !seen.has(addon.id)) {
        seen.add(addon.id);
        result.push(addon);
      }
    });
    return result;
  }

  if (isRecord(data)) {
    const wrapped = getWrappedValue(data);
    if (wrapped !== undefined) {
      return normalizeAddons(wrapped, options);
    }
    if (hasAddonShape(data)) {
      const single = toAddon(data, fallbackVariantId, 0);
      return single ? [single] : [];
    }
    const entries = Object.entries(data).map(([key, value]) =>
      isRecord(value) && value.id === undefined ? { ...value, id: key } : value,
    );
    return normalizeAddons(entries, options);
  }

  return [];
}
