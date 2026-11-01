import localFont from 'next/font/local';

/**
 * BaliWild — Self-hosted fonts
 * --------------------------------
 * The fonts are committed to the repository and served from our own origin
 * instead of being fetched from fonts.googleapis.com at build time.
 *
 * WHY
 * ---
 * `next/font/google` downloads the font files during `next build`. When that
 * request fails — an offline build machine, a flaky network, a blocked
 * request — the whole production build fails. Self-hosting removes the
 * external dependency, avoids a request to Google from every visitor's
 * browser, and makes the build reproducible.
 *
 * Files, weights and their licence live in `src/fonts/`.
 */

export const barlowCondensed = localFont({
  src: [
    {
      path: '../fonts/barlow-condensed-latin-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/barlow-condensed-latin-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-heading',
  display: 'swap',
  fallback: ['Arial Narrow', 'sans-serif'],
  adjustFontFallback: false,
});

export const plusJakartaSans = localFont({
  src: '../fonts/plus-jakarta-sans-latin-variable.woff2',
  weight: '200 800',
  style: 'normal',
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: false,
});
