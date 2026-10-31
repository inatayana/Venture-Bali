/**
 * Country dial codes for the guest contact form.
 * Indonesia is first (primary market); the rest are alphabetical.
 * Codes are ISO 3166-1 alpha-2, matching `Booking.countryCode`.
 */

export interface Country {
  code: string;
  name: string;
  dial: string;
}

export const COUNTRIES: Country[] = [
  { code: 'ID', name: 'Indonesia', dial: '62' },
  { code: 'AE', name: 'United Arab Emirates', dial: '971' },
  { code: 'AR', name: 'Argentina', dial: '54' },
  { code: 'AT', name: 'Austria', dial: '43' },
  { code: 'AU', name: 'Australia', dial: '61' },
  { code: 'BE', name: 'Belgium', dial: '32' },
  { code: 'BR', name: 'Brazil', dial: '55' },
  { code: 'CA', name: 'Canada', dial: '1' },
  { code: 'CH', name: 'Switzerland', dial: '41' },
  { code: 'CL', name: 'Chile', dial: '56' },
  { code: 'CN', name: 'China', dial: '86' },
  { code: 'CO', name: 'Colombia', dial: '57' },
  { code: 'CZ', name: 'Czechia', dial: '420' },
  { code: 'DE', name: 'Germany', dial: '49' },
  { code: 'DK', name: 'Denmark', dial: '45' },
  { code: 'EG', name: 'Egypt', dial: '20' },
  { code: 'ES', name: 'Spain', dial: '34' },
  { code: 'FI', name: 'Finland', dial: '358' },
  { code: 'FR', name: 'France', dial: '33' },
  { code: 'GB', name: 'United Kingdom', dial: '44' },
  { code: 'GR', name: 'Greece', dial: '30' },
  { code: 'HK', name: 'Hong Kong', dial: '852' },
  { code: 'IE', name: 'Ireland', dial: '353' },
  { code: 'IL', name: 'Israel', dial: '972' },
  { code: 'IN', name: 'India', dial: '91' },
  { code: 'IT', name: 'Italy', dial: '39' },
  { code: 'JP', name: 'Japan', dial: '81' },
  { code: 'KE', name: 'Kenya', dial: '254' },
  { code: 'KR', name: 'South Korea', dial: '82' },
  { code: 'MX', name: 'Mexico', dial: '52' },
  { code: 'MY', name: 'Malaysia', dial: '60' },
  { code: 'NG', name: 'Nigeria', dial: '234' },
  { code: 'NL', name: 'Netherlands', dial: '31' },
  { code: 'NO', name: 'Norway', dial: '47' },
  { code: 'NZ', name: 'New Zealand', dial: '64' },
  { code: 'PE', name: 'Peru', dial: '51' },
  { code: 'PH', name: 'Philippines', dial: '63' },
  { code: 'PL', name: 'Poland', dial: '48' },
  { code: 'PT', name: 'Portugal', dial: '351' },
  { code: 'QA', name: 'Qatar', dial: '974' },
  { code: 'RU', name: 'Russia', dial: '7' },
  { code: 'SA', name: 'Saudi Arabia', dial: '966' },
  { code: 'SE', name: 'Sweden', dial: '46' },
  { code: 'SG', name: 'Singapore', dial: '65' },
  { code: 'TH', name: 'Thailand', dial: '66' },
  { code: 'TR', name: 'Türkiye', dial: '90' },
  { code: 'TW', name: 'Taiwan', dial: '886' },
  { code: 'UA', name: 'Ukraine', dial: '380' },
  { code: 'US', name: 'United States', dial: '1' },
  { code: 'VN', name: 'Vietnam', dial: '84' },
  { code: 'ZA', name: 'South Africa', dial: '27' },
];

export const DEFAULT_COUNTRY_CODE = 'ID';

export function findCountry(code: string | undefined | null): Country {
  return COUNTRIES.find((country) => country.code === code) ?? COUNTRIES[0];
}

/** Label used in the dropdown, e.g. "Australia (+61)". */
export function countryLabel(country: Country): string {
  return `${country.name} (+${country.dial})`;
}
