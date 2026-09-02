'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
  getDay,
} from 'date-fns';
import { cn } from '@/utils/cn';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  blackoutDates?: string[];
  minDate?: Date;
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function Calendar({
  selectedDate,
  onDateSelect,
  blackoutDates = [],
  minDate = new Date(),
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = startOfDay(minDate);

  const blackoutDateObjects = useMemo(
    () => blackoutDates.map((d) => new Date(d)),
    [blackoutDates]
  );

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startPadding = getDay(startOfMonth(currentMonth));

  const isBlackout = (date: Date) =>
    blackoutDateObjects.some((bd) => isSameDay(bd, date));

  const isPast = (date: Date) => isBefore(date, today);

  const handlePrev = () => setCurrentMonth((m) => subMonths(m, 1));
  const handleNext = () => setCurrentMonth((m) => addMonths(m, 1));

  return (
    <div className={cn('select-none', className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrev}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={handleNext}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const disabled = isPast(day) || isBlackout(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !disabled && onDateSelect(day)}
              disabled={disabled}
              className={cn(
                'aspect-square flex items-center justify-center rounded-lg text-sm transition-colors',
                disabled && 'text-gray-300 cursor-not-allowed line-through',
                !disabled && !selected && 'hover:bg-blue-50 text-gray-900',
                selected && 'bg-blue-600 text-white font-bold',
                isToday && !selected && 'ring-2 ring-blue-300'
              )}
              aria-label={format(day, 'MMMM d, yyyy')}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
