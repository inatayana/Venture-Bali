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
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="text-sm font-medium text-foreground-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className={cn(
            'w-11 h-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center',
            'border-2 transition-colors',
            value <= min
              ? 'border-line text-foreground-muted/50 cursor-not-allowed'
              : 'border-line-control text-foreground hover:bg-inset active:bg-line'
          )}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center text-lg font-bold text-foreground">
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className={cn(
            'w-11 h-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center',
            'border-2 transition-colors',
            value >= max
              ? 'border-line text-foreground-muted/50 cursor-not-allowed'
              : 'border-line-control text-foreground hover:bg-inset active:bg-line'
          )}
          aria-label={`Increase ${label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
