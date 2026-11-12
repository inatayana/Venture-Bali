const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/**
 * Report-only CSP.
 *
 * It starts in report-only mode so payment channels and Snap.js can be
 * observed without breaking checkout. The allowlist covers the app itself,
 * Supabase Storage and the Midtrans Snap surfaces. `unsafe-eval` is only added
 * for the dev server.
 *
 * There is no report endpoint yet: violations surface in the browser console.
 * Add `report-to` when telemetry lands, then rename the header to
 * `Content-Security-Policy` after a clean release cycle.
 */
function buildContentSecurityPolicy(phase) {
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (phase === PHASE_DEVELOPMENT_SERVER) scriptSrc.push("'unsafe-eval'");
  scriptSrc.push('https://app.midtrans.com', 'https://app.sandbox.midtrans.com');

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    "media-src 'self'",
    "connect-src 'self' https://*.supabase.co https://api.midtrans.com https://app.midtrans.com https://app.sandbox.midtrans.com",
    "frame-src 'self' https://app.midtrans.com https://app.sandbox.midtrans.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://app.midtrans.com https://app.sandbox.midtrans.com",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ].join('; ');
}

/**
 * Dev output goes to `.next-dev`, production output stays in `.next`.
 *
 * `next dev` and `next start` both write to `.next` by default, so running the
 * dev server while a production server was up silently wiped the build and made
 * `next start` fail with "Could not find a production build in the '.next'
 * directory" (HTTP 500 on every route). Separate directories let both run at the
 * same time, and keep `.next` as the deploy output Vercel expects.
 */
/** @type {(phase: string) => import('next').NextConfig} */

/**
 * Allow uploaded Supabase Storage media through the next/image optimizer so
 * visitors get device-appropriate sizes from the edge (media architecture
 * memo: 1 stored master, variants generated on demand).
 */
function supabaseImagePatterns() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];
  try {
    const { hostname, protocol } = new URL(url);
    if (!hostname || (protocol !== 'https:' && protocol !== 'http:')) return [];
    return [
      {
        protocol: protocol.replace(/:$/, ''),
        hostname,
        pathname: '/storage/v1/object/public/**',
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig = phase => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  reactStrictMode: true,
  images: {
    /*
     * Local SVG placeholders are the only SVG source and no remotePatterns are
     * configured, so the optimizer never fetches a user-supplied SVG. Remove
     * this flag once the catalogue moves to raster photography.
     */
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    remotePatterns: supabaseImagePatterns(),
  },
  async redirects() {
    return [
      // A magic link opened on /trips still reaches the customer area. Kept at
      // the HTTP level so it works before any client JavaScript runs.
      {
        source: '/trips',
        has: [{ type: 'query', key: 'token' }],
        destination: '/my/bookings',
        permanent: false, // 307 — the token in the query is forwarded along.
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
      },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      // Keep the Midtrans Snap popup working while still isolating the opener.
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
      {
        key: 'Content-Security-Policy-Report-Only',
        value: buildContentSecurityPolicy(phase),
      },
    ];
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      });
    }
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
});

module.exports = nextConfig;
