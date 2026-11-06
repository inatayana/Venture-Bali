import {
  findDistrictName,
  findRegencyName,
  getDistricts,
  getRegencies,
  getVillages,
  isKnownVillage,
  normalizeAreaName,
  PROVINSI_DEFAULT,
} from './wilayah';

describe('wilayah dataset', () => {
  it('covers all nine Bali kabupaten/kota', () => {
    const regencies = getRegencies();
    expect(regencies).toHaveLength(9);
    for (const expected of [
      'Badung',
      'Bangli',
      'Buleleng',
      'Denpasar',
      'Gianyar',
      'Jembrana',
      'Karang Asem',
      'Klungkung',
      'Tabanan',
    ]) {
      expect(regencies).toContain(expected);
    }
    expect(PROVINSI_DEFAULT).toBe('Bali');
  });

  it('lists kecamatan per kabupaten', () => {
    expect(getDistricts('Badung')).toEqual(
      expect.arrayContaining(['Kuta', 'Kuta Selatan', 'Kuta Utara', 'Mengwi'])
    );
    expect(getDistricts('Gianyar')).toContain('Ubud');
    expect(getDistricts('Tidak Ada')).toEqual([]);
  });

  it('lists desa per kecamatan only', () => {
    const ubudVillages = getVillages('Gianyar', 'Ubud');
    expect(ubudVillages).toEqual(expect.arrayContaining(['Mas', 'Peliatan', 'Sayan']));
    // A village from another kecamatan must not leak in.
    expect(ubudVillages).not.toContain('Canggu');
    expect(getVillages('Gianyar', 'Tidak Ada')).toEqual([]);
  });

  it('matches legacy spellings through normalisation', () => {
    expect(normalizeAreaName('Karang Asem')).toBe('karangasem');
    expect(findRegencyName('karangasem')).toBe('Karang Asem');
    expect(findRegencyName('  Badung ')).toBe('Badung');
    expect(findRegencyName('Nowhere')).toBeNull();
    expect(findDistrictName('Badung', 'kuta utara')).toBe('Kuta Utara');
    expect(findDistrictName('Nowhere', 'Kuta')).toBeNull();
  });

  it('validates villages against the official list', () => {
    expect(isKnownVillage('Badung', 'Kuta Selatan', 'Pecatu')).toBe(true);
    expect(isKnownVillage('Badung', 'Kuta Selatan', 'Ubud')).toBe(false);
    expect(isKnownVillage('Nowhere', 'Kuta Selatan', 'Pecatu')).toBe(false);
  });
});
