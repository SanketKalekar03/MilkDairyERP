import React from 'react';
import { Card } from '../../../components/ui/Card';
import { formatCurrency, formatQuantity } from '../../../lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  amount: number;
  qtyKg?: number;
  qtyLitres?: number;
  txCount: number;
  icon: LucideIcon;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  amount,
  qtyKg,
  qtyLitres,
  txCount,
  icon: Icon,
  subtitle,
}) => {
  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between border-[#afc4d4] hover:border-[#567C8D] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#567C8D]">
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] text-gray-500 block">{subtitle}</span>
          )}
        </div>
        <div className="w-9 h-9 rounded bg-[#C8D9E6] text-[#2F4156] flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#2F4156] font-mono tabular-nums">
          {formatCurrency(amount)}
        </div>

        {/* Breakdown quantities (kg and litres separate!) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#567C8D] font-medium pt-1">
          {qtyKg !== undefined && (
            <span>
              Kg: <strong className="text-[#2F4156]">{formatQuantity(qtyKg)}</strong>
            </span>
          )}
          {qtyLitres !== undefined && (
            <span>
              Litres: <strong className="text-[#2F4156]">{formatQuantity(qtyLitres)}</strong>
            </span>
          )}
          <span>
            Tx: <strong className="text-[#2F4156]">{txCount}</strong>
          </span>
        </div>
      </div>
    </Card>
  );
};
