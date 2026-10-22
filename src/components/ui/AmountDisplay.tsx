import React from 'react';
import { formatCurrency, cn } from '../../lib/utils';

export interface AmountDisplayProps {
  amount: number | string | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-semibold',
    lg: 'text-xl font-bold tracking-tight',
    xl: 'text-2xl font-bold tracking-tight',
  };

  return (
    <span className={cn('text-[#2F4156] font-mono tabular-nums', sizes[size], className)}>
      {formatCurrency(amount)}
    </span>
  );
};
