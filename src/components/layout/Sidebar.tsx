import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Milk,
  ReceiptText,
  Users,
  Store,
  CalendarDays,
  Percent,
  Clock,
  UserCog,
  LogOut,
  X,
  History,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UserRole } from '../../types/database';

export interface SidebarProps {
  role: UserRole;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  userName,
  isOpen,
  onClose,
  onLogout,
}) => {
  const isAdmin = role === 'admin';

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-colors',
      isActive
        ? 'bg-[#567C8D] text-white shadow-sm'
        : 'text-[#C8D9E6] hover:bg-[#243344] hover:text-white'
    );

  const subNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2.5 px-3 py-1.5 text-xs rounded transition-colors pl-8',
      isActive
        ? 'text-white font-semibold bg-[#243344]'
        : 'text-[#C8D9E6]/80 hover:text-white hover:bg-[#243344]/50'
    );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#2F4156] flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Dairy Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#3a5068]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#567C8D] flex items-center justify-center text-white">
              <Milk className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">
                GOKUL DAIRY
              </span>
              <span className="text-[10px] text-[#C8D9E6] uppercase tracking-wider block font-medium">
                Collection & Sales ERP
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#C8D9E6] hover:text-white p-1 rounded lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Group */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8ba6b4]">
              Operations
            </div>

            <NavLink to="/dashboard" onClick={onClose} className={navLinkClasses}>
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </NavLink>

            {/* Collection Group */}
            <div>
              <NavLink to="/collection" end onClick={onClose} className={navLinkClasses}>
                <Milk className="w-4 h-4 shrink-0" />
                <span>Milk Collection</span>
              </NavLink>
              <NavLink to="/collection/history" onClick={onClose} className={subNavLinkClasses}>
                <History className="w-3.5 h-3.5 shrink-0" />
                <span>Collection History</span>
              </NavLink>
            </div>

            {/* Sales Group */}
            <div>
              <NavLink to="/sales" end onClick={onClose} className={navLinkClasses}>
                <Store className="w-4 h-4 shrink-0" />
                <span>Milk Sales</span>
              </NavLink>
              <NavLink to="/sales/history" onClick={onClose} className={subNavLinkClasses}>
                <History className="w-3.5 h-3.5 shrink-0" />
                <span>Sales History</span>
              </NavLink>
            </div>
          </div>

          {/* Master Records */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8ba6b4]">
              Entities & Billing
            </div>

            <NavLink to="/farmers" onClick={onClose} className={navLinkClasses}>
              <Users className="w-4 h-4 shrink-0" />
              <span>Farmers</span>
            </NavLink>

            <NavLink to="/customers" onClick={onClose} className={navLinkClasses}>
              <Store className="w-4 h-4 shrink-0" />
              <span>Customers</span>
            </NavLink>

            <NavLink to="/billing/farmers" onClick={onClose} className={navLinkClasses}>
              <ReceiptText className="w-4 h-4 shrink-0" />
              <span>Farmer Bills</span>
            </NavLink>

            <NavLink to="/billing/customers" onClick={onClose} className={navLinkClasses}>
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>Customer Bills</span>
            </NavLink>
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8ba6b4]">
                Administration
              </div>

              <NavLink to="/rates/collection" onClick={onClose} className={navLinkClasses}>
                <Percent className="w-4 h-4 shrink-0" />
                <span>Collection Rates</span>
              </NavLink>

              <NavLink to="/rates/selling" onClick={onClose} className={navLinkClasses}>
                <Percent className="w-4 h-4 shrink-0" />
                <span>Selling Rates</span>
              </NavLink>

              <NavLink to="/settings/shifts" onClick={onClose} className={navLinkClasses}>
                <Clock className="w-4 h-4 shrink-0" />
                <span>Shift Timings</span>
              </NavLink>

              <NavLink to="/users" onClick={onClose} className={navLinkClasses}>
                <UserCog className="w-4 h-4 shrink-0" />
                <span>Manage Users</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-[#3a5068] bg-[#243344]">
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 text-[#C8D9E6] bg-[#3a5068] rounded">
                {role}
              </span>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="text-[#C8D9E6] hover:text-white p-1.5 rounded hover:bg-[#3a5068] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
