import { LOCALES, translate } from './locale';

describe('locale messages', () => {
  it('supports EN and ID only for Phase A', () => {
    expect(LOCALES.map((locale) => locale.code)).toEqual(['en', 'id']);
  });

  it('translates the hero and header copy', () => {
    expect(translate('en', 'heroBook')).toBe('Discover Bali. Book Direct.');
    expect(translate('id', 'heroBook')).toBe('Jelajahi Bali. Pesan Langsung.');
    expect(translate('id', 'heroOwn')).toContain('Dipandu');
    expect(translate('id', 'headerTagline')).toContain('Taklukkan');
  });
});
