'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SUPPORTED_CURRENCIES, type Currency } from '@/lib/fx';

interface CurrencySwitcherProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  className?: string;
}

export function CurrencySwitcher({
  selectedCurrency,
  onCurrencyChange,
  className,
}: CurrencySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{selected?.flag}</span>
        <span>{selected?.code}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 max-h-60 overflow-y-auto"
          role="listbox"
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              type="button"
              onClick={() => {
                onCurrencyChange(currency.code);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                currency.code === selectedCurrency
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
              role="option"
              aria-selected={currency.code === selectedCurrency}
            >
              <span>{currency.flag}</span>
              <span>{currency.code}</span>
              <span className="text-gray-400 ml-auto text-xs">{currency.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
