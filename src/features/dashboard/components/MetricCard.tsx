import React from 'react';
import { Card } from '../../../components/ui/Card';
import { formatCurrency, formatQuantity } from '../../../lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  amount: number;
  qtyLitres?: number;
  txCount?: number;
  icon: LucideIcon;
  subtitle?: string;
  variant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'navy';
  badge?: React.ReactNode;
  primaryMetric?: 'litres' | 'currency';
  details?: Array<{ label: string; value: string | number }>;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  amount,
  qtyLitres,
  txCount,
  icon: Icon,
  subtitle,
  variant = 'navy',
  badge,
  primaryMetric = 'litres',
  details,
  onClick,
}) => {
  const variantStyles = {
    navy: {
      iconBg: 'bg-[#C8D9E6] text-[#2F4156]',
      borderTop: 'border-t-3 border-t-[#2F4156]',
    },
    blue: {
      iconBg: 'bg-blue-100 text-blue-700',
      borderTop: 'border-t-3 border-t-blue-600',
    },
    emerald: {
      iconBg: 'bg-emerald-100 text-emerald-700',
      borderTop: 'border-t-3 border-t-emerald-600',
    },
    amber: {
      iconBg: 'bg-amber-100 text-amber-700',
      borderTop: 'border-t-3 border-t-amber-500',
    },
    purple: {
      iconBg: 'bg-purple-100 text-purple-700',
      borderTop: 'border-t-3 border-t-purple-600',
    },
  };

  const style = variantStyles[variant] || variantStyles.navy;
  const showLitres = qtyLitres !== undefined && primaryMetric === 'litres';

  return (
    <Card
      onClick={onClick}
      className={`p-3 sm:p-3.5 flex flex-col justify-between border-[#afc4d4] hover:shadow-sm transition-all duration-150 ${
        style.borderTop
      } ${onClick ? 'cursor-pointer hover:border-[#567C8D]' : ''}`}
    >
      <div>
        {/* Header: Title, Badge, and Icon in one tight row */}
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#567C8D] truncate">
            {title}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {badge}
            <div className={`w-6.5 h-6.5 rounded-md ${style.iconBg} flex items-center justify-center`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Primary Numbers: Large Litres & Rupee value in one row */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-[#2F4156] font-mono tabular-nums">
            {showLitres ? formatQuantity(qtyLitres) : formatCurrency(amount)}
          </div>
          {showLitres && (
            <div className="text-xs font-semibold text-[#567C8D] font-mono tabular-nums shrink-0">
              {formatCurrency(amount)}
            </div>
          )}
          {!showLitres && qtyLitres !== undefined && (
            <div className="text-xs font-semibold text-[#567C8D] font-mono tabular-nums shrink-0">
              {formatQuantity(qtyLitres)}
            </div>
          )}
        </div>
      </div>

      {/* Footer Details: single compact row */}
      {details && details.length > 0 ? (
        <div className="mt-2 pt-1.5 border-t border-[#afc4d4]/50 flex items-center justify-between text-[10px] text-[#567C8D] truncate font-medium">
          {details.map((item, idx) => (
            <span key={idx} className="truncate">
              {item.label}: <strong className="text-[#2F4156] font-mono">{item.value}</strong>
              {idx < details.length - 1 && <span className="mx-1 text-gray-300">•</span>}
            </span>
          ))}
        </div>
      ) : (
        txCount !== undefined && (
          <div className="mt-2 pt-1.5 border-t border-[#afc4d4]/50 text-[10px] text-[#567C8D]">
            Entries: <strong className="text-[#2F4156] font-mono">{txCount}</strong>
          </div>
        )
      )}
    </Card>
  );
};
