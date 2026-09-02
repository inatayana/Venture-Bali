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
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            'border-2 transition-colors',
            value <= min
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100'
          )}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center text-lg font-bold text-gray-900">
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            'border-2 transition-colors',
            value >= max
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100'
          )}
          aria-label={`Increase ${label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
