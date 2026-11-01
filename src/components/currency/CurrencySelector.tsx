'use client';

import { useCurrency } from './CurrencyProvider';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { ACTIVE_CURRENCY_INFO, type ActiveCurrency } from '@/lib/currency';

export function CurrencySelector({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <CurrencySwitcher
      selectedCurrency={currency}
      onCurrencyChange={(next) => setCurrency(next as ActiveCurrency)}
      currencies={ACTIVE_CURRENCY_INFO}
      className={className}
    />
  );
}
