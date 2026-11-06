'use client';

import { ThemeProvider, themeInitScript } from '@/components/theme/ThemeProvider';

/**
 * Client-side wrapper for admin layout that provides theme context.
 * Must be a separate component because ThemeProvider uses 'use client'.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      <ThemeProvider>{children}</ThemeProvider>
    </>
  );
}