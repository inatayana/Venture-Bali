import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from 'next/constants';

import nextConfig from './next.config.js';

describe('next.config', () => {
  it('writes dev output outside the production build directory', () => {
    expect(nextConfig(PHASE_DEVELOPMENT_SERVER).distDir).toBe('.next-dev');
  });

  it('keeps the production build in .next for deployment', () => {
    expect(nextConfig(PHASE_PRODUCTION_BUILD).distDir).toBe('.next');
    expect(nextConfig(PHASE_PRODUCTION_SERVER).distDir).toBe('.next');
  });

  it('keeps the SVG image optimizer settings', () => {
    expect(nextConfig(PHASE_PRODUCTION_SERVER).images).toEqual({
      dangerouslyAllowSVG: true,
      contentDispositionType: 'inline',
    });
  });

  it('ships report-only CSP and popup-safe headers', async () => {
    const headersFn = nextConfig(PHASE_PRODUCTION_SERVER).headers;
    if (!headersFn) throw new Error('headers() is not configured');

    const [entry] = await headersFn();
    const headers = Object.fromEntries(
      (entry?.headers ?? []).map((header: { key: string; value: string }) => [
        header.key,
        header.value,
      ]),
    );

    expect(headers['Content-Security-Policy-Report-Only']).toContain(
      "default-src 'self'",
    );
    expect(headers['Content-Security-Policy']).toBeUndefined();
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin-allow-popups');
    expect(headers['X-DNS-Prefetch-Control']).toBe('on');
  });
});
