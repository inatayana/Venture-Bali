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
export function createThemeInitScript(storageKey: string = THEME_KEY): string {
  return `
  (function () {
    try {
      var stored = localStorage.getItem('${storageKey}');
      if (stored === 'dark') document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = stored === 'dark' ? 'dark' : 'light';
    } catch (e) {}
  })();
`;
}

export const themeInitScript = createThemeInitScript();

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({
  children,
  storageKey = THEME_KEY,
}: {
  children: React.ReactNode;
  storageKey?: string;
}) {
  // Light is the product default. Dark is opt-in (toggle or stored preference),
  // matching themeInitScript which only adds `.dark` when 'dark' is stored.
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const initial: Theme = stored === 'dark' ? 'dark' : 'light';
    setThemeState(initial);
    applyTheme(initial);
  }, [storageKey]);

  const value = useMemo(() => {
    const setTheme = (next: Theme) => {
      setThemeState(next);
      window.localStorage.setItem(storageKey, next);
      applyTheme(next);
    };
    return {
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    };
  }, [theme, storageKey]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
