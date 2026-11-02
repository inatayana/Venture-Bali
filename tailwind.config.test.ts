import config from './tailwind.config.js';

type TestConfig = {
  theme?: { extend?: { colors?: Record<string, unknown> } };
};

describe('tailwind semantic tokens', () => {
  const colors =
    (config as TestConfig).theme?.extend?.colors ?? {};

  it('keeps brand as the single accent source', () => {
    expect(colors.brand).toBe('rgb(var(--brand) / <alpha-value>)');
    expect(colors['brand-ink']).toBe('rgb(var(--brand-ink) / <alpha-value>)');
    expect(colors).not.toHaveProperty('accent');
    expect(colors).not.toHaveProperty('accent-yellow');
  });

  it('maps semantic surfaces, text and lines', () => {
    expect(colors.base).toBe('rgb(var(--bg-base) / <alpha-value>)');
    expect(colors.surface).toBe('rgb(var(--bg-surface) / <alpha-value>)');
    expect(colors.card).toEqual({
      DEFAULT: 'rgb(var(--bg-card) / <alpha-value>)',
      hover: 'rgb(var(--bg-card-hover) / <alpha-value>)',
    });
    expect(colors.foreground).toEqual({
      DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
      secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
      muted: 'rgb(var(--text-muted) / <alpha-value>)',
    });
    expect(colors.line).toEqual({
      DEFAULT: 'rgb(var(--border-subtle) / <alpha-value>)',
      strong: 'rgb(var(--border-strong) / <alpha-value>)',
      control: 'rgb(var(--border-control) / <alpha-value>)',
    });
  });
});
