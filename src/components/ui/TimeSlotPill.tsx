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
          ? 'border-neutral-900 bg-neutral-900 text-white'
          : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400',
        disabled && 'border-neutral-100 bg-neutral-50 text-neutral-300 line-through cursor-not-allowed'
      )}
    >
      <span>{label}</span>
      {typeof spotsLeft === 'number' && !disabled && (
        <span
          className={cn(
            'text-[10px] font-normal leading-tight',
            selected ? 'text-white/70' : 'text-neutral-500'
          )}
        >
          {spotsLeft} left
        </span>
      )}
    </button>
  );
}
