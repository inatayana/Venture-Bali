'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CollapsibleTextProps {
  text: string;
  /** Characters shown while collapsed (default 225). */
  limit?: number;
  className?: string;
  id?: string;
}

/**
 * Long description with an in-place "Read more" accordion.
 *
 * Only the paragraph height changes when toggled, so nothing above or below it
 * jumps (no layout shift) and the content is never re-fetched.
 */
export function CollapsibleText({ text, limit = 225, className, id }: CollapsibleTextProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.trim().length > limit;

  const excerpt = (() => {
    const trimmed = text.trim();
    if (!isLong) return trimmed;
    const slice = trimmed.slice(0, limit);
    const breakIndex = slice.lastIndexOf(' ');
    return `${slice.slice(0, breakIndex > 0 ? breakIndex : limit).trimEnd()}…`;
  })();

  return (
    <div>
      <p id={id} className={className}>
        {expanded || !isLong ? text.trim() : excerpt}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={id}
          className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-neutral-900 underline decoration-brand decoration-2 underline-offset-4 transition-colors hover:text-neutral-700"
        >
          {expanded ? 'Read less' : 'Read more'}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-200', expanded && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
