'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SUPPORTED_CURRENCIES, type Currency, type CurrencyInfo } from '@/lib/fx';

interface CurrencySwitcherProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  currencies?: readonly CurrencyInfo[];
  className?: string;
}

export function CurrencySwitcher({
  selectedCurrency,
  onCurrencyChange,
  currencies = SUPPORTED_CURRENCIES,
  className,
}: CurrencySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = currencies.find((c) => c.code === selectedCurrency);

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
        className="flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-current transition-colors hover:bg-brand/30"
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
          {currencies.map((currency) => (
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
                  ? 'bg-brand/40 text-brand-ink font-medium'
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
