export type Theme = 'light' | 'dark';

export const THEME_KEY = 'baliwild_theme';

/**
 * Explicit choice wins; otherwise follow the operating system. This is the
 * single resolver used by both the pre-paint script and the React provider.
 */
export function resolveInitialTheme(
  stored: string | null,
  prefersDark: boolean,
): Theme {
  if (stored === 'dark' || stored === 'light') return stored;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Runs before paint. Keep this implementation identical to the resolver above:
 * localStorage > prefers-color-scheme > light.
 */
export const themeInitScript = `
  (function () {
    try {
      var stored = localStorage.getItem('${THEME_KEY}');
      var prefersDark = window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
      var theme = stored === 'dark' || stored === 'light'
        ? stored
        : (prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
    } catch (e) {}
  })();
`;
