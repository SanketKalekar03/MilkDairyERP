import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'navy' | 'teal' | 'sky' | 'neutral' | 'success' | 'warning' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  children,
  ...props
}) => {
  const variants = {
    navy: 'bg-[#2F4156] text-white',
    teal: 'bg-[#567C8D] text-white',
    sky: 'bg-[#C8D9E6] text-[#2F4156]',
    neutral: 'bg-[#F5EFEB] text-[#2F4156] border border-[#afc4d4]',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    warning: 'bg-amber-100 text-amber-900 border border-amber-300',
    danger: 'bg-rose-100 text-rose-800 border border-rose-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
