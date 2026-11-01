import type { ReactNode } from 'react';

/**
 * Bold the lead-in of a list item ("Minimum age: 12" -> "**Minimum age:** 12")
 * so packing and safety rules are scannable at a glance.
 */
export function emphasiseLead(item: string): ReactNode {
  const index = item.indexOf(':');
  if (index <= 0) return item;

  const lead = item.slice(0, index).trim();
  const rest = item.slice(index + 1);

  return (
    <>
      <strong className="font-semibold text-neutral-900">{lead}:</strong>
      {rest}
    </>
  );
}
