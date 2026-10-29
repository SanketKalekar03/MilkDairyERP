import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import type { ShiftCollectionMetric, MilkShift } from '../../../types/database';
import { ShiftBadge } from '../../../components/ui/ShiftBadge';
import { formatCurrency, formatQuantity } from '../../../lib/utils';
import { Milk, Plus, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ShiftCollectionTableProps {
  shift: MilkShift;
  data: ShiftCollectionMetric;
}

export const ShiftCollectionTable: React.FC<ShiftCollectionTableProps> = ({
  shift,
  data,
}) => {
  const hasData = (data.total_litres || 0) > 0 || (data.tx_count || 0) > 0;

  return (
    <Card className="border-[#afc4d4] flex flex-col justify-between">
      <div>
        <CardHeader className="bg-[#faf7f5] py-3 px-4 border-b border-[#afc4d4]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center">
              <Milk className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-[#2F4156]">
                Procurement / Collection
              </CardTitle>
              <span className="text-[10px] text-[#567C8D]">
                Farmers milk intake
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShiftBadge shift={shift} />
            <span className="text-xs font-bold text-[#2F4156] bg-white px-2 py-0.5 rounded border border-[#afc4d4] font-mono">
              {data.tx_count} Entries
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F5EFEB]/50 border-b border-[#afc4d4] text-[10px] font-bold uppercase tracking-wider text-[#567C8D]">
                <th className="py-2.5 px-4">Milk Type</th>
                <th className="py-2.5 px-4 text-right">Volume (Litres)</th>
                <th className="py-2.5 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1ebf3]">
              {/* Cow Row */}
              <tr className="hover:bg-[#faf7f5] transition-colors">
                <td className="py-2.5 px-4 font-semibold text-[#2F4156] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Cow Milk</span>
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
                <td className="py-2.5 px-4 font-semibold text-[#2F4156] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>Buffalo Milk</span>
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
                <td className="py-2.5 px-4 text-right font-mono text-[#2F4156] tabular-nums font-extrabold">
                  {formatQuantity(data.total_litres)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-[#2F4156] tabular-nums text-sm font-extrabold">
                  {formatCurrency(data.total_amount)}
                </td>
              </tr>
            </tbody>
          </table>

          {!hasData && (
            <div className="py-4 text-center text-xs text-[#567C8D] bg-white border-b border-[#afc4d4]/40">
              <p>No milk collection recorded yet for this shift.</p>
            </div>
          )}
        </CardContent>
      </div>

      <div className="px-4 py-2.5 bg-[#faf7f5] border-t border-[#afc4d4]/60 flex items-center justify-between text-xs">
        <span className="text-[#567C8D]">
          {hasData ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Shift active
            </span>
          ) : (
            'Awaiting intake'
          )}
        </span>
        <Link
          to="/collection"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 font-sans"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Collection</span>
        </Link>
      </div>
    </Card>
  );
};
