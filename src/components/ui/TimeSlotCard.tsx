import { cn } from '@/utils/cn';
import type { SlotTime } from '@/types/venture';

interface TimeSlotCardProps {
  slot: SlotTime;
  isSelected: boolean;
  onSelect: (slot: SlotTime) => void;
  className?: string;
}

export function TimeSlotCard({
  slot,
  isSelected,
  onSelect,
  className,
}: TimeSlotCardProps) {
  const spotsLeft = slot.maxCapacity - slot.currentBookings;
  const isSoldOut = spotsLeft <= 0;
  const isLow = spotsLeft > 0 && spotsLeft <= 3;

  return (
    <button
      type="button"
      onClick={() => !isSoldOut && onSelect(slot)}
      disabled={isSoldOut}
      className={cn(
        'flex flex-col items-center p-4 rounded-xl border-2 transition-all min-w-[100px]',
        isSoldOut && 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed',
        !isSoldOut && !isSelected && 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50',
        isSelected && 'border-blue-600 bg-blue-50 ring-2 ring-blue-200',
        className
      )}
      aria-label={`${slot.time}, ${isSoldOut ? 'sold out' : `${spotsLeft} spots available`}`}
    >
      <span className={cn(
        'text-lg font-bold',
        isSoldOut ? 'text-gray-400' : isSelected ? 'text-blue-600' : 'text-gray-900'
      )}>
        {slot.time}
      </span>
      <span className={cn(
        'text-xs mt-1',
        isSoldOut ? 'text-gray-400' : isLow ? 'text-red-500 font-medium' : 'text-gray-500'
      )}>
        {isSoldOut ? 'Sold out' : `${spotsLeft} left`}
      </span>
    </button>
  );
}
