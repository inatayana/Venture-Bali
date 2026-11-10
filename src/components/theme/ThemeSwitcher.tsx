'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeSwitcher({
  className,
  onThemeChange,
}: { className?: string; onThemeChange?: (theme: 'light' | 'dark') => void }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleToggle = () => {
    const next = isDark ? 'light' : 'dark';
    toggleTheme();
    onThemeChange?.(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-current transition-colors hover:bg-brand/30 dark:hover:bg-brand/20 ${className ?? ''}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
