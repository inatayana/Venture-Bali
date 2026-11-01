import { LOCALES, translate } from './locale';

describe('locale messages', () => {
  it('supports EN and ID only for Phase A', () => {
    expect(LOCALES.map((locale) => locale.code)).toEqual(['en', 'id']);
  });

  it('translates the hero and header copy', () => {
    expect(translate('en', 'heroBook')).toBe('Book the');
    expect(translate('id', 'heroBook')).toBe('Pesan');
    expect(translate('id', 'heroOwn')).toContain('Taklukkan');
    expect(translate('id', 'headerTagline')).toContain('Taklukkan');
  });
});
