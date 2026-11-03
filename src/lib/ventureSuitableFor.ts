import type { SuitableFor } from '@/types/venture';

const SUITABLE_VALUES: readonly SuitableFor[] = ['KIDS', 'COUPLE', 'FAMILY', 'SOLO', 'GROUP'];

/**
 * Older seed data stored free-text labels ("Families", "Team building").
 * Normalise them to the five values the product page understands, dedupe and
 * cap at five so the admin edit form can never submit an invalid array.
 */
export function normaliseSuitableFor(value: unknown): SuitableFor[] {
  if (!Array.isArray(value)) return [];

  const mapped: SuitableFor[] = [];
  for (const raw of value) {
    if (typeof raw !== 'string') continue;
    const key = raw.trim().toLowerCase();
    let next: SuitableFor | null = null;

    if (key.includes('famil')) next = 'FAMILY';
    else if (key.includes('coupl')) next = 'COUPLE';
    else if (key.includes('kid') || key.includes('child')) next = 'KIDS';
    else if (key.includes('group') || key.includes('team')) next = 'GROUP';
    else if (key.includes('solo') || key.includes('first-time') || key.includes('active')) next = 'SOLO';
    else {
      const upper = raw.trim().toUpperCase();
      if ((SUITABLE_VALUES as readonly string[]).includes(upper)) next = upper as SuitableFor;
    }

    if (next && !mapped.includes(next)) mapped.push(next);
  }

  return mapped.slice(0, 5);
}
