import React from 'react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  className 
}) => {
  return (
    <div className={cn(
      'text-destructive text-sm font-medium',
      className
    )}>
      {message}
    </div>
  );
};

interface ErrorPageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ 
  title = 'Something went wrong',
  message,
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-destructive">{title}</h2>
        <p className="text-muted-foreground max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};