import React from 'react';
import { clsx } from 'clsx';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, rows = 4, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={clsx(
            'w-full rounded-lg border px-3 py-2 text-sm resize-y placeholder-slate-400',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
            'dark:placeholder-slate-600',
            error
              ? 'border-red-400 bg-red-50 text-red-900 dark:border-red-500/60 dark:bg-red-950/30'
              : [
                  'border-slate-200 bg-white text-slate-900',
                  'dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100',
                  'hover:border-slate-300 dark:hover:border-slate-600',
                ],
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 dark:text-red-400 animate-fade-in">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
