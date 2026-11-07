'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
}

export function Stepper({
  label,
  value,
  min = 0,
  max = 20,
  onChange,
  className,
}: StepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      navigator.vibrate?.(10);
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      navigator.vibrate?.(10);
      onChange(value + 1);
    }
  };

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className="text-sm font-medium text-gray-700 min-w-[80px]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          onTouchStart={() => navigator.vibrate?.(10)}
          disabled={value <= min}
          className={cn(
            'w-12 h-12 min-h-[48px] min-w-[48px] rounded-full flex items-center justify-center',
            'border-2 transition-colors transition-transform',
            'touch-action-manipulation select-none',
            value <= min
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-neutral-900 text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 active:scale-[0.92]'
          )}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-5 h-5" />
        </button>
        <span className="w-12 text-center text-xl font-bold text-gray-900">
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          onTouchStart={() => navigator.vibrate?.(10)}
          disabled={value >= max}
          className={cn(
            'w-12 h-12 min-h-[48px] min-w-[48px] rounded-full flex items-center justify-center',
            'border-2 transition-colors transition-transform',
            'touch-action-manipulation select-none',
            value >= max
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-neutral-900 text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 active:scale-[0.92]'
          )}
          aria-label={`Increase ${label}`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}