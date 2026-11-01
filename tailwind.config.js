/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'Arial Narrow', 'sans-serif'],
      },
      colors: {
        ink: '#1A1A1A',
        jungle: '#1E3A2B',
        sand: '#E5DFD5',
        /**
         * Brand tokens are driven by the CSS variables in src/styles/globals.css
         * (`--brand`, `--brand-ink`). Wrapping them in rgb(... / <alpha-value>)
         * keeps opacity utilities like `bg-brand/30` working.
         *
         * Contrast rule: `brand` is only used as a background with black text,
         * or as text on the paired ink.
         */
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-ink': 'rgb(var(--brand-ink) / <alpha-value>)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blink: {
          '0%, 45%': { opacity: '1' },
          '50%, 95%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        blink: 'blink 0.7s steps(1, end) infinite',
      },
    },
  },
  plugins: [],
};
