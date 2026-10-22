import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import type { ShiftCollectionMetric, MilkShift } from '../../../types/database';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { formatCurrency, formatQuantity } from '../../../lib/utils';

export interface ShiftCollectionTableProps {
  shift: MilkShift;
  data: ShiftCollectionMetric;
}

export const ShiftCollectionTable: React.FC<ShiftCollectionTableProps> = ({
  shift,
  data,
}) => {
  return (
    <Card className="border-[#afc4d4]">
      <CardHeader className="bg-[#F5EFEB] py-3">
        <div className="flex items-center gap-2">
          <ShiftBadge shift={shift} />
          <CardTitle className="text-sm">Collection Breakdown</CardTitle>
        </div>
        <span className="text-xs font-semibold text-[#567C8D]">
          {data.tx_count} Entries
        </span>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F5EFEB]/60 border-b border-[#afc4d4] text-[11px] font-bold uppercase tracking-wider text-[#567C8D]">
              <th className="py-2.5 px-4">Milk Type</th>
              <th className="py-2.5 px-4 text-right">Kg Qty</th>
              <th className="py-2.5 px-4 text-right">Litre Qty</th>
              <th className="py-2.5 px-4 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e1ebf3]">
            {/* Cow Row */}
            <tr className="hover:bg-[#faf7f5] transition-colors">
              <td className="py-2.5 px-4 font-semibold text-[#2F4156]">
                Cow Milk
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-700">
                {formatQuantity(data.cow_kg)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-700">
                {formatQuantity(data.cow_litres)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#2F4156] tabular-nums">
                {formatCurrency(data.cow_amount)}
              </td>
            </tr>

            {/* Buffalo Row */}
            <tr className="hover:bg-[#faf7f5] transition-colors">
              <td className="py-2.5 px-4 font-semibold text-[#2F4156]">
                Buffalo Milk
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-700">
                {formatQuantity(data.buffalo_kg)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-700">
                {formatQuantity(data.buffalo_litres)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#2F4156] tabular-nums">
                {formatCurrency(data.buffalo_amount)}
              </td>
            </tr>

            {/* Shift Total Row */}
            <tr className="bg-[#F5EFEB] font-bold border-t border-[#afc4d4]">
              <td className="py-2.5 px-4 text-[#2F4156] uppercase tracking-wider text-[11px]">
                Shift Total
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-[#2F4156] tabular-nums">
                {formatQuantity(data.total_kg)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-[#2F4156] tabular-nums">
                {formatQuantity(data.total_litres)}
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
