import { normalizeAddons } from './addons';

const baseAddon = {
  id: 'addon-001',
  variantId: 'var-001',
  name: 'Professional Photographer',
  price: 150000,
  description: '1-hour session with 20 edited photos',
  requiresTransfer: false,
  isCombo: false,
};

describe('normalizeAddons', () => {
  it('returns empty array for undefined', () => {
    expect(normalizeAddons(undefined)).toEqual([]);
  });

  it('returns empty array for null', () => {
    expect(normalizeAddons(null)).toEqual([]);
  });

  it('passes through a valid Addon[] array', () => {
    const result = normalizeAddons([baseAddon]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('addon-001');
    expect(result[0].price).toBe(150000);
  });

  it('normalizes a single addon object into an array', () => {
    const result = normalizeAddons(baseAddon);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Professional Photographer');
  });

  it('unwraps { addons: [...] } object format', () => {
    const result = normalizeAddons({ addons: [baseAddon] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('addon-001');
  });

  it('unwraps { items: [...] } object format', () => {
    const result = normalizeAddons({ items: [baseAddon] });
    expect(result).toHaveLength(1);
  });

  it('normalizes a keyed record map using keys as ids', () => {
    const result = normalizeAddons({
      'addon-001': { name: 'Photographer', price: 150000 },
      'addon-002': { name: 'Lunch', price: 85000 },
    });
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id)).toEqual(['addon-001', 'addon-002']);
  });

  it('parses a JSON string containing an array', () => {
    const json = JSON.stringify([baseAddon]);
    const result = normalizeAddons(json);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('addon-001');
  });

  it('parses a JSON string containing a wrapped object', () => {
    const json = JSON.stringify({ addons: [baseAddon] });
    const result = normalizeAddons(json);
    expect(result).toHaveLength(1);
  });

  it('returns empty array for invalid JSON string', () => {
    expect(normalizeAddons('{not-json')).toEqual([]);
  });

  it('drops entries missing name', () => {
    const result = normalizeAddons([{ id: 'x', price: 100 }]);
    expect(result).toEqual([]);
  });

  it('drops entries with invalid price', () => {
    const result = normalizeAddons([{ id: 'x', name: 'No price', price: 'abc' }]);
    expect(result).toEqual([]);
  });

  it('coerces numeric string prices', () => {
    const result = normalizeAddons([{ id: 'x', name: 'String price', price: '85000' }]);
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(85000);
  });

  it('generates id from name when missing', () => {
    const result = normalizeAddons([{ name: 'Traditional Balinese Lunch', price: 85000 }]);
    expect(result[0].id).toBe('traditional-balinese-lunch');
  });

  it('applies fallback variantId when variantId missing', () => {
    const result = normalizeAddons([{ name: 'Lunch', price: 85000 }], { variantId: 'var-009' });
    expect(result[0].variantId).toBe('var-009');
  });

  it('preserves requiresTransfer and isCombo flags', () => {
    const combo = { ...baseAddon, id: 'combo-001', requiresTransfer: true, isCombo: true };
    const result = normalizeAddons([combo]);
    expect(result[0].requiresTransfer).toBe(true);
    expect(result[0].isCombo).toBe(true);
  });

  it('deduplicates entries with the same id', () => {
    const result = normalizeAddons([baseAddon, { ...baseAddon, price: 999 }]);
    expect(result).toHaveLength(1);
  });

  it('mixes valid and invalid entries keeping only valid ones', () => {
    const result = normalizeAddons([
      'not-valid',
      null,
      baseAddon,
      { noShape: true },
      'not-json',
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('addon-001');
  });

  it('handles empty array', () => {
    expect(normalizeAddons([])).toEqual([]);
  });

  it('handles empty object', () => {
    expect(normalizeAddons({})).toEqual([]);
  });
});
