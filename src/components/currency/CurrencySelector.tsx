'use client';

import { useCurrency } from './CurrencyProvider';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { ACTIVE_CURRENCY_INFO, type ActiveCurrency } from '@/lib/currency';
import { type Currency } from '@/lib/fx';

export function CurrencySelector({
  className,
  onCurrencyChange,
  dropUp = false,
}: { className?: string; onCurrencyChange?: (currency: Currency) => void; dropUp?: boolean }) {
  const { currency, setCurrency } = useCurrency();

  const handleCurrencyChange = (next: Currency) => {
    setCurrency(next as ActiveCurrency);
    onCurrencyChange?.(next);
  };

  return (
    <CurrencySwitcher
      selectedCurrency={currency}
      onCurrencyChange={handleCurrencyChange}
      currencies={ACTIVE_CURRENCY_INFO}
      className={className}
      dropUp={dropUp}
    />
  );
}
