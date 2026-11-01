import { approximateUsd } from './fx';

describe('approximateUsd', () => {
  it('converts IDR at the fallback rate', () => {
    expect(approximateUsd(160000)).toBe(10);
    expect(approximateUsd(450000)).toBe(28);
  });

  it('rounds to the nearest dollar', () => {
    expect(approximateUsd(400000)).toBe(25);
    expect(approximateUsd(390000)).toBe(24);
  });
});
