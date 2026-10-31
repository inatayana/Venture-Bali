import { COUNTRIES, countryLabel, findCountry } from './countries';
import { toInternationalPhone } from './phone';

describe('country list', () => {
  it('starts with Indonesia and uses unique ISO codes', () => {
    expect(COUNTRIES[0].code).toBe('ID');
    const codes = COUNTRIES.map((country) => country.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('finds a country and falls back to Indonesia', () => {
    expect(findCountry('AU').dial).toBe('61');
    expect(findCountry('XX').code).toBe('ID');
    expect(findCountry(undefined).code).toBe('ID');
    expect(countryLabel(findCountry('SG'))).toBe('Singapore (+65)');
  });
});

describe('international phone composition', () => {
  it('strips the local trunk zero and adds the dial code', () => {
    expect(toInternationalPhone('62', '0812 3456 7890')).toBe('+6281234567890');
    expect(toInternationalPhone('61', '0412 345 678')).toBe('+61412345678');
  });

  it('does not double-prefix an already international number', () => {
    expect(toInternationalPhone('62', '62812 3456 7890')).toBe('+6281234567890');
    expect(toInternationalPhone('44', '+44 7700 900123')).toBe('+447700900123');
  });

  it('returns an empty string when there are no digits', () => {
    expect(toInternationalPhone('62', '')).toBe('');
    expect(toInternationalPhone('62', 'abc')).toBe('');
  });
});
