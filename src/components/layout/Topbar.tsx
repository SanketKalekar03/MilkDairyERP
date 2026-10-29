import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import type { MilkShift } from '../../types/database';

export interface TopbarProps {
  onToggleSidebar: () => void;
  currentShift?: MilkShift;
  isShiftActive?: boolean;
  businessDate?: string;
  morningWindow?: string;
  eveningWindow?: string;
  userName?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  currentShift = 'morning',
  isShiftActive = true,
  morningWindow,
  eveningWindow,
  userName,
}) => {
  const isMorning = currentShift === 'morning';

  return (
    <header className="h-16 bg-white border-b border-[#afc4d4] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & Shift indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded text-[#2F4156] hover:bg-[#F5EFEB] lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current shift badge - Informational only */}
        <div className="flex items-center gap-2 bg-[#F5EFEB] px-3 py-1.5 rounded border border-[#afc4d4]">
          {isMorning ? (
            <Sun className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 text-[#2F4156] shrink-0" />
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#567C8D] font-bold uppercase tracking-wider">
                Shift:
              </span>
              <span className="text-xs font-bold text-[#2F4156] uppercase">
                {isMorning ? 'Morning' : 'Evening'}
              </span>
            </div>
            {!isShiftActive && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-100 px-1 rounded">
                Outside Window
              </span>
            )}
          </div>
        </div>

        {/* Informational Shift Windows (Desktop only) */}
        <div className="hidden xl:flex items-center gap-3 text-xs text-[#567C8D]">
          {morningWindow && (
            <span>
              Morn: <span className="text-[#2F4156] font-medium">{morningWindow}</span>
            </span>
          )}
          {eveningWindow && (
            <span>
              Eve: <span className="text-[#2F4156] font-medium">{eveningWindow}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right: User */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Greeting / User avatar initial */}
        {userName && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#567C8D] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {userName.charAt(0)}
            </div>
            <span className="hidden md:inline-block text-xs font-semibold text-[#2F4156]">
              {userName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
