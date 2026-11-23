'use client';

import { createThemeInitScript, ThemeProvider } from '@/components/theme/ThemeProvider';

const ADMIN_THEME_KEY = 'baliwild_admin_theme';

/**
 * Operator-panel theme. It deliberately uses a different storage key from the
 * guest site so an operator's dark preference never overwrites the customer
 * preference. The `data-admin` shell supplies the indigo/slate palette.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: createThemeInitScript(ADMIN_THEME_KEY) }} />
      <ThemeProvider storageKey={ADMIN_THEME_KEY}>{children}</ThemeProvider>
    </>
  );
}
