'use client';

import { BOTTOM_NAV_ITEMS } from '@/lib/navigationConfig';
import { useBottomNavigation } from '@/hooks/useBottomNavigation';
import { BottomNavigationItem } from './BottomNavigationItem';
import { cn } from '@/utils/cn';
import { Z_INDEX } from '@/lib/zIndex';
import { usePathname } from 'next/navigation';

/**
 * Global Bottom Navigation — App Shell.
 * Always visible on first-level routes, hides on transactional/immersive routes,
 * on keyboard, and when forced (e.g., full-screen consent).
 * 
 * Safe area bottom respected via `pb-safe` (Tailwind) / `env(safe-area-inset-bottom)`.
 * Z-index: 45 (below cookie consent 55, above header 40).
 */
export function BottomNavigation() {
  const { isVisible, activeKey } = useBottomNavigation();
  const pathname = usePathname();

  if (!isVisible) return null;

  // During SSR, pathname might be null. Use a fallback for initial render.
  const safePathname = pathname ?? '/';

  return (
    <nav
      role="navigation"
      aria-label="Primary navigation"
      className={cn(
        'fixed inset-x-0 bottom-0 z-[45]',
        'flex h-16 items-center justify-around',
        'bg-white/95 backdrop-blur-sm border-t border-neutral-200',
        'dark:bg-neutral-950/95 dark:border-white/10',
        'pb-safe',
        'transition-transform duration-300 ease-out',
        'transform translate-y-0'
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: Z_INDEX.bottomNav,
      } as React.CSSProperties}
    >
      {BOTTOM_NAV_ITEMS.map((config) => (
        <BottomNavigationItem
          key={config.key}
          config={config}
          isActive={config.key === activeKey}
          pathname={safePathname}
        />
      ))}
    </nav>
  );
}