/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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

        /*
         * Semantic layers (v3.9.0). Use these instead of raw `bg-white` /
         * `text-gray-*` when migrating a component in PR2.
         */
        base: 'rgb(var(--bg-base) / <alpha-value>)',
        surface: 'rgb(var(--bg-surface) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--bg-card) / <alpha-value>)',
          hover: 'rgb(var(--bg-card-hover) / <alpha-value>)',
        },
        inset: 'rgb(var(--bg-inset) / <alpha-value>)',
        overlay: 'rgb(var(--overlay) / <alpha-value>)',
        foreground: {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--border-subtle) / <alpha-value>)',
          strong: 'rgb(var(--border-strong) / <alpha-value>)',
          control: 'rgb(var(--border-control) / <alpha-value>)',
        },
        success: 'rgb(var(--state-success) / <alpha-value>)',
        warning: 'rgb(var(--state-warning) / <alpha-value>)',
        danger: 'rgb(var(--state-danger) / <alpha-value>)',
        info: 'rgb(var(--state-info) / <alpha-value>)',
        'button-secondary': {
          DEFAULT: 'rgb(var(--button-secondary) / <alpha-value>)',
          hover: 'rgb(var(--button-secondary-hover) / <alpha-value>)',
          active: 'rgb(var(--button-secondary-active) / <alpha-value>)',
        },
        'button-secondary-foreground':
          'rgb(var(--button-secondary-foreground) / <alpha-value>)',
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
