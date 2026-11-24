'use client';

import { SortMenu, type SortOption } from './SortMenu';

interface CatalogueSortMenuProps {
  value: string;
  options: readonly SortOption[];
  /**
   * Destination URL per option value. The listing pages are server
   * components, so they build the URLs and pass them down — function props
   * cannot cross the server/client boundary.
   */
  urls: Record<string, string>;
  className?: string;
}

/**
 * Server-component wrapper for SortMenu: navigates to a prebuilt URL when
 * the guest picks a sort order.
 */
export function CatalogueSortMenu({ value, options, urls, className }: CatalogueSortMenuProps) {
  return (
    <SortMenu
      value={value}
      options={options}
      className={className}
      onChange={(next) => {
        const url = urls[next];
        if (url) window.location.href = url;
      }}
    />
  );
}
