import { cn } from '@/utils/cn';

interface BrandWordmarkProps {
  className?: string;
}

/**
 * BaliWild wordmark: BALI + WILD in a solid accent block. The block is the
 * brand's signature, so it is the only place the accent is used as a text
 * background. Colour is inherited for "Bali" and fixed black for "Wild".
 */
export function BrandWordmark({ className }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline font-heading font-bold uppercase leading-none tracking-wider',
        className
      )}
    >
      Bali
      <span className="bg-brand px-1 text-brand-ink">Wild</span>
    </span>
  );
}
