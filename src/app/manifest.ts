import type { MetadataRoute } from 'next';

/**
 * Installable PWA manifest.
 * Next exposes this at /manifest.webmanifest and injects the <link> tag.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Venture Bali — Adventure Booking',
    short_name: 'Venture Bali',
    description:
      'Book ATV, rafting, tubing and trekking adventures in Bali. Instant confirmation, mobile-first checkout.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#111827',
    lang: 'en',
    categories: ['travel', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Browse adventures',
        short_name: 'Adventures',
        url: '/',
      },
      {
        name: 'River tubing in Ubud',
        short_name: 'Tubing',
        url: '/experiences/ubud-river-tubing-adventure/ubud-river-tubing-adventure',
      },
    ],
  };
}
