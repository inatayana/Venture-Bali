import { cn } from '@/utils/cn';

interface BrandWordmarkProps {
  className?: string;
  /** Full yellow block with even padding and identical colours in light and dark mode. */
  solid?: boolean;
}

/**
 * BaliWild wordmark: BALI + WILD in a solid accent block. The default keeps
 * the classic two-tone mark; `solid` is used by the shared desktop header.
 */
export function BrandWordmark({ className, solid = false }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-heading font-bold uppercase leading-none tracking-wider',
        solid
          ? 'gap-1 rounded-lg bg-brand p-2.5 text-brand-ink'
          : 'text-brand-ink dark:text-white',
        className
      )}
    >
      Bali
      <span className={solid ? undefined : 'bg-brand px-1.5 py-0.5 text-brand-ink leading-none'}>
        Wild
      </span>
    </span>
  );
}
