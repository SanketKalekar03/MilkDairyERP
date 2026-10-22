import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data. Please try again.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-rose-50 border border-rose-200 rounded p-6 text-center flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
      <p className="text-xs text-rose-700 max-w-md mt-1">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-4 border-rose-300 text-rose-800 hover:bg-rose-100" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
