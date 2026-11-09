import { cn } from '@/utils/cn';

interface BrandWordmarkProps {
  className?: string;
}

/**
 * BaliWild wordmark: BALI + WILD in a solid accent block. The block is the
 * brand's signature, so it is the only place the accent is used as a text
 * background. Colour is inherited for "Bali" and fixed black for "Wild".
 * 
 * The yellow block has equal padding on all sides for a proportional box
 * with vertically centered "WILD" text in both light and dark modes.
 */
export function BrandWordmark({ className }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-heading font-bold uppercase leading-none tracking-wider text-brand-ink dark:text-white',
        className
      )}
    >
      Bali
      <span className="bg-brand px-1.5 py-0.5 text-brand-ink dark:text-brand-ink leading-none">
        Wild
      </span>
    </span>
  );
}
