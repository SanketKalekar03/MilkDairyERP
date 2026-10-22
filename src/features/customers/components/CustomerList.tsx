import React, { useState, useMemo } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { PageHeader } from '../../../components/layout/PageHeader';
import { TableSkeleton } from '../../../components/skeletons/TableSkeleton';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { CustomerModal } from './CustomerModal';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import type { Customer } from '../../../types/database';
import { customerService } from '../services/customerService';
import { formatDate } from '../../../lib/utils';
import { Plus, Search, Edit2, UserCheck, UserX, Store } from 'lucide-react';

export const CustomerList: React.FC = () => {
  const { customers, isLoading, refreshCustomers } = useCustomers(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchName = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPhone = c.phone ? c.phone.includes(searchTerm) : false;
      return matchName || matchPhone;
    });
  }, [customers, searchTerm]);

  const handleToggleActive = async (customer: Customer) => {
    setTogglingId(customer.id);
    try {
      await customerService.toggleActive(customer.id, customer.is_active);
      await refreshCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to update customer status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers Management"
        subtitle="Manage retail and bulk milk customers who purchase in litres."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddNew}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Customer
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="bg-white p-3 rounded border border-[#afc4d4] flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#567C8D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded border border-[#afc4d4] bg-[#F5EFEB] text-[#2F4156] focus:bg-white"
          />
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'No matching customers found' : 'No customers registered yet'}
          description={
            searchTerm
              ? `No customer found matching "${searchTerm}". Try a different name or phone.`
              : 'Add your first customer to start recording daily milk sales.'
          }
          icon={<Store className="w-6 h-6" />}
          actionLabel={searchTerm ? undefined : 'Add Customer'}
          onAction={searchTerm ? undefined : handleAddNew}
        />
      ) : (
        <div className="bg-white rounded border border-[#afc4d4] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5EFEB] border-b border-[#afc4d4] text-[11px] font-bold uppercase tracking-wider text-[#567C8D]">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1ebf3]">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#faf7f5] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#2F4156]">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {c.phone || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="py-3 px-4 text-[#567C8D]">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(c)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={c.is_active ? 'outline' : 'secondary'}
                        onClick={() => handleToggleActive(c)}
                        isLoading={togglingId === c.id}
                        leftIcon={
                          c.is_active ? (
                            <UserX className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Add/Edit Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={refreshCustomers}
      />
    </div>
  );
};
