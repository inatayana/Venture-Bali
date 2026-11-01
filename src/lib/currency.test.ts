import {
  ACTIVE_CURRENCIES,
  convertIdr,
  currencyForCountry,
  formatMoney,
  isActiveCurrency,
  type ActiveCurrency,
} from './currency';

const rates: Record<ActiveCurrency, number> = {
  IDR: 1,
  USD: 16000,
  EUR: 17400,
  AUD: 10500,
  SGD: 11900,
  CNY: 2200,
  INR: 190,
  KRW: 11.9,
  JPY: 107,
};

describe('Phase A currencies', () => {
  it('only exposes the nine launch currencies', () => {
    expect(ACTIVE_CURRENCIES).toEqual([
      'IDR',
      'USD',
      'EUR',
      'AUD',
      'SGD',
      'CNY',
      'INR',
      'KRW',
      'JPY',
    ]);
    expect(isActiveCurrency('GBP')).toBe(false);
    expect(isActiveCurrency('USD')).toBe(true);
  });

  it('maps the main source markets to a currency', () => {
    expect(currencyForCountry('US')).toBe('USD');
    expect(currencyForCountry('AU')).toBe('AUD');
    expect(currencyForCountry('SG')).toBe('SGD');
    expect(currencyForCountry('CN')).toBe('CNY');
    expect(currencyForCountry('IN')).toBe('INR');
    expect(currencyForCountry('KR')).toBe('KRW');
    expect(currencyForCountry('JP')).toBe('JPY');
    expect(currencyForCountry('DE')).toBe('EUR');
    expect(currencyForCountry('FR')).toBe('EUR');
    expect(currencyForCountry('ID')).toBe('IDR');
    expect(currencyForCountry(null)).toBe('IDR');
  });

  it('converts from IDR using IDR-per-unit rates', () => {
    expect(convertIdr(160000, 'USD', rates)).toBe(10);
    expect(convertIdr(450000, 'AUD', rates)).toBe(43);
    expect(convertIdr(450000, 'IDR', rates)).toBe(450000);
  });

  it('formats the selected currency', () => {
    expect(formatMoney(300000, 'IDR', rates)).toContain('300.000');
    expect(formatMoney(300000, 'USD', rates)).toBe('$19');
    expect(formatMoney(300000, 'EUR', rates)).toBe('€17');
    expect(formatMoney(300000, 'SGD', rates)).toBe('S$25');
    expect(formatMoney(300000, 'CNY', rates)).toBe('¥136');
    expect(formatMoney(300000, 'INR', rates)).toBe('₹1,579');
    expect(formatMoney(300000, 'JPY', rates)).toBe('¥2,804');
    expect(formatMoney(300000, 'KRW', rates)).toBe('₩25,210');
  });
});
