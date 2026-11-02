const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/**
 * Report-only CSP.
 *
 * It starts in report-only mode so payment channels and Snap.js can be
 * observed without breaking checkout. The allowlist covers the app itself,
 * Supabase Storage and the Midtrans Snap surfaces. Once the violation report
 * is clean for a full release cycle, rename the header to
 * `Content-Security-Policy` and keep this list in sync.
 */
const CONTENT_SECURITY_POLICY_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.midtrans.com https://app.sandbox.midtrans.com",
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
        value: CONTENT_SECURITY_POLICY_REPORT_ONLY,
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
