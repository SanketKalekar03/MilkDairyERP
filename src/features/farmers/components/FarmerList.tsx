import React, { useState, useMemo } from 'react';
import { useFarmers } from '../hooks/useFarmers';
import { PageHeader } from '../../../components/layout/PageHeader';
import { TableSkeleton } from '../../../components/skeletons/TableSkeleton';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { FarmerModal } from './FarmerModal';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import type { Farmer } from '../../../types/database';
import { farmerService } from '../services/farmerService';
import { formatDate } from '../../../lib/utils';
import { Plus, Search, Edit2, UserCheck, UserX, Users } from 'lucide-react';

export const FarmerList: React.FC = () => {
  const { farmers, isLoading, refreshFarmers } = useFarmers(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredFarmers = useMemo(() => {
    return farmers.filter((f) => {
      const matchName = f.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPhone = f.phone ? f.phone.includes(searchTerm) : false;
      return matchName || matchPhone;
    });
  }, [farmers, searchTerm]);

  const handleToggleActive = async (farmer: Farmer) => {
    setTogglingId(farmer.id);
    try {
      await farmerService.toggleActive(farmer.id, farmer.is_active);
      await refreshFarmers();
    } catch (err: any) {
      alert(err.message || 'Failed to update farmer status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedFarmer(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Farmers Management"
        subtitle="Manage registered dairy farmers who supply milk."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddNew}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Farmer
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="bg-white p-3 rounded border border-[#afc4d4] flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#567C8D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search farmers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded border border-[#afc4d4] bg-[#F5EFEB] text-[#2F4156] focus:bg-white"
          />
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : filteredFarmers.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'No matching farmers found' : 'No farmers registered yet'}
          description={
            searchTerm
              ? `No farmer found matching "${searchTerm}". Try a different name or phone.`
              : 'Add your first dairy farmer to begin recording daily milk collections.'
          }
          icon={<Users className="w-6 h-6" />}
          actionLabel={searchTerm ? undefined : 'Add Farmer'}
          onAction={searchTerm ? undefined : handleAddNew}
        />
      ) : (
        <div className="bg-white rounded border border-[#afc4d4] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5EFEB] border-b border-[#afc4d4] text-[11px] font-bold uppercase tracking-wider text-[#567C8D]">
                  <th className="py-3 px-4">Farmer Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1ebf3]">
                {filteredFarmers.map((f) => (
                  <tr key={f.id} className="hover:bg-[#faf7f5] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#2F4156]">
                      {f.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {f.phone || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={f.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="py-3 px-4 text-[#567C8D]">
                      {formatDate(f.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(f)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={f.is_active ? 'outline' : 'secondary'}
                        onClick={() => handleToggleActive(f)}
                        isLoading={togglingId === f.id}
                        leftIcon={
                          f.is_active ? (
                            <UserX className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {f.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Farmer Add/Edit Modal */}
      <FarmerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        farmer={selectedFarmer}
        onSuccess={refreshFarmers}
      />
    </div>
  );
};
