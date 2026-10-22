import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../../auth/hooks/useAuth';
import { PageHeader } from '../../../components/layout/PageHeader';
import { TableSkeleton } from '../../../components/skeletons/TableSkeleton';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { userService } from '../services/userService';
import { formatDate } from '../../../lib/utils';
import type { UserRole } from '../../../types/database';
import { UserCog, RefreshCw, Shield, User } from 'lucide-react';

export const UserManagementList: React.FC = () => {
  const { users, isLoading, refreshUsers } = useUsers();
  const { user: currentAuthUser } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      await userService.updateUserRole(userId, newRole);
      await refreshUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (userId === currentAuthUser?.id) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }

    setUpdatingId(userId);
    try {
      await userService.toggleUserActive(userId, currentStatus);
      await refreshUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user account status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="User & Role Management"
        subtitle="Admin control panel to manage staff user accounts and assign Operator or Admin roles."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={refreshUsers}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No user profiles found"
          description="User profiles are automatically provisioned when authenticated through Supabase Auth."
          icon={<UserCog className="w-6 h-6" />}
        />
      ) : (
        <div className="bg-white rounded border border-[#afc4d4] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5EFEB] border-b border-[#afc4d4] text-[11px] font-bold uppercase tracking-wider text-[#567C8D]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Assign Role & Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1ebf3]">
                {users.map((u) => {
                  const isSelf = u.id === currentAuthUser?.id;

                  return (
                    <tr key={u.id} className="hover:bg-[#faf7f5] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#2F4156] flex items-center gap-2">
                          <span>{u.full_name}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-[#C8D9E6] text-[#2F4156] px-1.5 py-0.2 rounded font-bold uppercase">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#567C8D] font-mono">{u.id}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-[#2F4156] text-white'
                              : 'bg-[#567C8D] text-white'
                          }`}
                        >
                          {u.role === 'admin' ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={u.is_active ? 'active' : 'inactive'} />
                      </td>

                      <td className="py-3 px-4 text-[#567C8D]">
                        {formatDate(u.created_at)}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        {/* Role selection dropdown */}
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          disabled={updatingId === u.id || (isSelf && u.role === 'admin')}
                          className="text-xs px-2 py-1 rounded border border-[#afc4d4] bg-white text-[#2F4156]"
                        >
                          <option value="operator">Operator</option>
                          <option value="admin">Admin</option>
                        </select>

                        {/* Status Toggle Button */}
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant={u.is_active ? 'outline' : 'secondary'}
                            onClick={() => handleToggleActive(u.id, u.is_active)}
                            isLoading={updatingId === u.id}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
