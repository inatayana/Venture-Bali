const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

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
    // Allow local SVG placeholders through the next/image optimizer (demo mode)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
  },
});

module.exports = nextConfig;
