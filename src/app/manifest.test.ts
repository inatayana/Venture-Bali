import manifest from './manifest';

describe('PWA manifest', () => {
  const config = manifest();

  it('is installable and opens standalone at the root', () => {
    expect(config.display).toBe('standalone');
    expect(config.start_url).toBe('/');
    expect(config.scope).toBe('/');
    expect(config.name).toContain('BaliWild');
    expect(config.short_name).toBe('BaliWild');
  });

  it('ships every icon size Android and iOS need', () => {
    const icons = config.icons ?? [];
    const sizes = icons.map((icon) => icon.sizes);
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  it('uses the brand theme colour', () => {
    expect(config.theme_color).toBe('#000000');
    expect(config.background_color).toBe('#000000');
  });
});
