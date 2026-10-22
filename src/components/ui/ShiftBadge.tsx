import React from 'react';
import type { MilkShift } from '../../types/database';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ShiftBadgeProps {
  shift: MilkShift;
  className?: string;
  showIcon?: boolean;
}

export const ShiftBadge: React.FC<ShiftBadgeProps> = ({
  shift,
  className,
  showIcon = true,
}) => {
  const isMorning = shift === 'morning';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider',
        isMorning
          ? 'bg-[#C8D9E6] text-[#2F4156] border border-[#afc4d4]'
          : 'bg-[#2F4156] text-white',
        className
      )}
    >
      {showIcon && (
        isMorning ? (
          <Sun className="w-3.5 h-3.5 text-amber-600" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-sky-200" />
        )
      )}
      <span>{isMorning ? 'Morning' : 'Evening'}</span>
    </span>
  );
};
