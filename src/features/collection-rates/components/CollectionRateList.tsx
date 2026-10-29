import React, { useState } from 'react';
import { useCollectionRates } from '../hooks/useCollectionRates';
import { PageHeader } from '../../../components/layout/PageHeader';
import { TableSkeleton } from '../../../components/skeletons/TableSkeleton';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { CollectionRateModal } from './CollectionRateModal';
import { MilkTypeBadge } from '../../../components/ui/MilkTypeBadge';
import { Button } from '../../../components/ui/Button';
import { formatDate, getTodayDateString } from '../../../lib/utils';
import { Plus, Percent, RefreshCw } from 'lucide-react';
import type { CollectionRateRule } from '../../../types/database';

export const CollectionRateList: React.FC = () => {
  const { rates, isLoading, refreshRates } = useCollectionRates();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'future' | 'expired'>('current');

  const today = getTodayDateString();

  const categorizedRates = rates.reduce(
    (acc, rate) => {
      if (rate.valid_to && rate.valid_to < today) {
        acc.expired.push(rate);
      } else if (rate.valid_from > today) {
        acc.future.push(rate);
      } else {
        acc.current.push(rate);
      }
      return acc;
    },
    { current: [] as CollectionRateRule[], future: [] as CollectionRateRule[], expired: [] as CollectionRateRule[] }
  );

  const displayedRates = categorizedRates[activeTab];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Collection Rate Rules"
        subtitle="Manage fat-based purchasing rates for cow and buffalo milk in Litres."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Rate Rule
          </Button>
        }
      />

      {/* Status Filter Tabs (Current / Future / Expired) */}
      <div className="flex border-b border-[#afc4d4] gap-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'current'
              ? 'border-[#2F4156] text-[#2F4156]'
              : 'border-transparent text-[#567C8D] hover:text-[#2F4156]'
          }`}
        >
          Currently Active ({categorizedRates.current.length})
        </button>
        <button
          onClick={() => setActiveTab('future')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'future'
              ? 'border-[#2F4156] text-[#2F4156]'
              : 'border-transparent text-[#567C8D] hover:text-[#2F4156]'
          }`}
        >
          Scheduled / Future ({categorizedRates.future.length})
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'expired'
              ? 'border-[#2F4156] text-[#2F4156]'
              : 'border-transparent text-[#567C8D] hover:text-[#2F4156]'
          }`}
        >
          Expired / Historical ({categorizedRates.expired.length})
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : displayedRates.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} collection rate rules`}
          description={
            activeTab === 'current'
              ? 'Add an active rate rule to begin collecting milk from farmers.'
              : `There are currently no ${activeTab} rate rules in the system.`
          }
          icon={<Percent className="w-6 h-6" />}
          actionLabel={activeTab === 'current' ? 'Add Rate Rule' : undefined}
          onAction={activeTab === 'current' ? () => setIsModalOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded border border-[#afc4d4] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5EFEB] border-b border-[#afc4d4] text-[11px] font-bold uppercase tracking-wider text-[#567C8D]">
                  <th className="py-3 px-4">Milk Type</th>
                  <th className="py-3 px-4">Fat Range</th>
                  <th className="py-3 px-4 text-right">Rate (₹ / Litre)</th>
                  <th className="py-3 px-4">Effective Period</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1ebf3]">
                {displayedRates.map((r) => (
                  <tr key={r.id} className="hover:bg-[#faf7f5] transition-colors">
                    <td className="py-3 px-4">
                      <MilkTypeBadge type={r.milk_type} />
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {r.fat_min.toFixed(1)}% — {r.fat_max.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#2F4156] tabular-nums text-sm">
                      ₹{r.rate_per_unit.toFixed(2)} / L
                    </td>
                    <td className="py-3 px-4 text-[#567C8D]">
                      {formatDate(r.valid_from)} to {r.valid_to ? formatDate(r.valid_to) : 'Present'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          activeTab === 'current'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : activeTab === 'future'
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}
                      >
                        {activeTab}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      <CollectionRateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshRates}
      />
    </div>
  );
};
