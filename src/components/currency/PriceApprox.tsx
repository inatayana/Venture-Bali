'use client';

import { cn } from '@/utils/cn';
import { formatMoney } from '@/lib/currency';
import { useCurrency } from './CurrencyProvider';

interface PriceApproxProps {
  amountIdr: number;
  className?: string;
  suffix?: string;
}

/** Approximate display price in the guest's chosen currency. IDR shows nothing. */
export function PriceApprox({ amountIdr, className, suffix = '' }: PriceApproxProps) {
  const { currency, rates } = useCurrency();
  if (currency === 'IDR') return null;

  return (
    <span className={cn('text-[11px] text-gray-500', className)}>
      ≈ {formatMoney(amountIdr, currency, rates)}
      {suffix}
    </span>
  );
}
