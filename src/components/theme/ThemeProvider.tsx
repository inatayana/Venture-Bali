'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { THEME_KEY, resolveInitialTheme, type Theme } from '@/lib/theme';

export { themeInitScript } from '@/lib/theme';
export type { Theme } from '@/lib/theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const initial = resolveInitialTheme(stored, media.matches);

    setThemeState(initial);
    applyTheme(initial);

    // Follow the OS only while the guest has not made an explicit choice.
    const handleChange = (event: MediaQueryListEvent) => {
      const current = window.localStorage.getItem(THEME_KEY);
      if (current === 'dark' || current === 'light') return;
      const next: Theme = event.matches ? 'dark' : 'light';
      setThemeState(next);
      applyTheme(next);
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const value = useMemo(() => {
    const setTheme = (next: Theme) => {
      setThemeState(next);
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {
        // Private mode can reject writes; the current page still switches.
      }
      applyTheme(next);
    };
    return {
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
