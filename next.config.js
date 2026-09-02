/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow local SVG placeholders through the next/image optimizer (demo mode)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
  },
};

module.exports = nextConfig;
