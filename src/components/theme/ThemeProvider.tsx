'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';

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

const THEME_KEY = 'baliwild_theme';

/** Runs before paint; keep in sync with ThemeProvider. */
export const themeInitScript = `
  (function () {
    try {
      var stored = localStorage.getItem('${THEME_KEY}');
      if (stored === 'dark') document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = stored === 'dark' ? 'dark' : 'light';
    } catch (e) {}
  })();
`;

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const initial: Theme = stored === 'dark' ? 'dark' : 'light';
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const value = useMemo(() => {
    const setTheme = (next: Theme) => {
      setThemeState(next);
      window.localStorage.setItem(THEME_KEY, next);
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
