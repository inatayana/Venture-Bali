import {
  DEFAULT_LOCALE,
  LOCALES,
  t,
  translate,
  getNamespace,
  formatPrice,
  formatDate,
} from './i18n';

describe('i18n public entry point', () => {
  it('exports the supported locales', () => {
    expect(LOCALES).toEqual(['en', 'id']);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('resolves namespaced and legacy flat keys', () => {
    expect(t('en', 'common', 'loading')).toBe('Loading...');
    expect(t('id', 'common', 'loading')).toBe('Memuat...');
    expect(translate('id', 'heroBook')).toBeTruthy();
    expect(translate('en', 'nav.home')).toBeTruthy();
  });

  it('falls back to English for a missing key', () => {
    expect(t('id', 'common', 'missing_key')).toBe('missing_key');
    expect(translate('id', 'unknown.key')).toBe('unknown.key');
  });

  it('returns a whole namespace for a locale', () => {
    const ns = getNamespace('id', 'common');
    expect(ns.loading).toBe('Memuat...');
    expect(Object.keys(ns).length).toBeGreaterThan(1);
  });

  it('formats prices and dates per locale', () => {
    expect(formatPrice(450000)).toContain('450.000');
    expect(formatPrice(450000, 'IDR', 'id')).toBe(formatPrice(450000));
    expect(typeof formatDate(new Date('2026-11-23T00:00:00Z'), 'id')).toBe('string');
  });
});
