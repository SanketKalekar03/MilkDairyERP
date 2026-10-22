import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'beige' | 'sky';
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'white',
  bordered = true,
  children,
  ...props
}) => {
  const backgrounds = {
    white: 'bg-white',
    beige: 'bg-[#F5EFEB]',
    sky: 'bg-[#e1ebf3]',
  };

  return (
    <div
      className={cn(
        'rounded shadow-sm overflow-hidden',
        backgrounds[variant],
        bordered && 'border border-[#afc4d4]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('px-5 py-4 border-b border-[#afc4d4] flex items-center justify-between', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={cn('text-base font-semibold text-[#2F4156]', className)} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('px-5 py-3 border-t border-[#afc4d4] bg-[#F5EFEB] flex items-center justify-end gap-3', className)}
    {...props}
  >
    {children}
  </div>
);
