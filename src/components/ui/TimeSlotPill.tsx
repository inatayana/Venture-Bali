import { cn } from '@/utils/cn';

interface TimeSlotPillProps {
  label: string;
  spotsLeft?: number;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

/**
 * Departure-time pill. The selected state is a solid dark fill so it reads
 * clearly in sunlight (mobile-first) and keeps a 44px touch target.
 */
export function TimeSlotPill({
  label,
  spotsLeft,
  selected,
  disabled = false,
  onSelect,
}: TimeSlotPillProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect()}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'min-h-[44px] rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors',
        'flex flex-col items-center justify-center tabular-nums',
        selected
          ? 'border-brand-ink bg-brand-ink text-brand dark:border-brand dark:bg-brand dark:text-brand-ink'
          : 'border-line-control bg-surface text-foreground hover:border-line-strong',
        disabled && 'border-line bg-base text-foreground-muted/50 line-through cursor-not-allowed'
      )}
    >
      <span>{label}</span>
      {typeof spotsLeft === 'number' && !disabled && (
        <span
          className={cn(
            'text-xs font-normal leading-tight',
            selected
              ? 'text-white/70 dark:text-brand-ink/70'
              : 'text-foreground-muted'
          )}
        >
          {spotsLeft} left
        </span>
      )}
    </button>
  );
}
