import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import type { ShiftSalesMetric, MilkShift } from '../../../types/database';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { formatCurrency, formatQuantity } from '../../../lib/utils';

export interface ShiftSalesTableProps {
  shift: MilkShift;
  data: ShiftSalesMetric;
}

export const ShiftSalesTable: React.FC<ShiftSalesTableProps> = ({
  shift,
  data,
}) => {
  return (
    <Card className="border-[#afc4d4]">
      <CardHeader className="bg-[#F5EFEB] py-3">
        <div className="flex items-center gap-2">
          <ShiftBadge shift={shift} />
          <CardTitle className="text-sm">Sales Breakdown</CardTitle>
        </div>
        <span className="text-xs font-semibold text-[#567C8D]">
          {data.tx_count} Sales
        </span>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F5EFEB]/60 border-b border-[#afc4d4] text-[11px] font-bold uppercase tracking-wider text-[#567C8D]">
              <th className="py-2.5 px-4">Milk Type</th>
              <th className="py-2.5 px-4 text-right">Volume (Litres)</th>
              <th className="py-2.5 px-4 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e1ebf3]">
            {/* Cow Sales */}
            <tr className="hover:bg-[#faf7f5] transition-colors">
              <td className="py-2.5 px-4 font-semibold text-[#2F4156]">
                Cow Milk
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-700">
                {formatQuantity(data.cow_litres, 'litre')}
              </td>
              <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#2F4156] tabular-nums">
                {formatCurrency(data.cow_amount)}
              </td>
            </tr>

            {/* Buffalo Sales */}
            <tr className="hover:bg-[#faf7f5] transition-colors">
              <td className="py-2.5 px-4 font-semibold text-[#2F4156]">
                Buffalo Milk
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-700">
                {formatQuantity(data.buffalo_litres, 'litre')}
              </td>
              <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#2F4156] tabular-nums">
                {formatCurrency(data.buffalo_amount)}
              </td>
            </tr>

            {/* Shift Sales Total */}
            <tr className="bg-[#F5EFEB] font-bold border-t border-[#afc4d4]">
              <td className="py-2.5 px-4 text-[#2F4156] uppercase tracking-wider text-[11px]">
                Shift Total
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-[#2F4156] tabular-nums">
                {formatQuantity(data.total_litres, 'litre')}
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-[#2F4156] tabular-nums text-sm">
                {formatCurrency(data.total_amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
