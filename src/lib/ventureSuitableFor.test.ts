import { normaliseSuitableFor } from './ventureSuitableFor';

describe('normaliseSuitableFor', () => {
  it('maps legacy seed labels to enum values', () => {
    expect(normaliseSuitableFor(['Groups', 'Team building', 'Active travellers'])).toEqual([
      'GROUP',
      'SOLO',
    ]);
    expect(normaliseSuitableFor(['Families', 'Children', 'Relaxed groups'])).toEqual([
      'FAMILY',
      'KIDS',
      'GROUP',
    ]);
  });

  it('keeps valid enum values and dedupes', () => {
    expect(normaliseSuitableFor(['COUPLE', 'FAMILY', 'Couples'])).toEqual(['COUPLE', 'FAMILY']);
  });

  it('caps the result at five and ignores unknown values', () => {
    expect(
      normaliseSuitableFor(['KIDS', 'COUPLE', 'FAMILY', 'SOLO', 'GROUP', 'Unknown'])
    ).toHaveLength(5);
    expect(normaliseSuitableFor(['Unknown', 42, null])).toEqual([]);
  });
});
