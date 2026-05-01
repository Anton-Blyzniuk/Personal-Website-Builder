import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  hover?: boolean;
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

export function Card({ children, className, padding = 'md', hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-200',
        'bg-white border-slate-200/80 shadow-sm',
        'dark:bg-slate-900 dark:border-slate-700/50 dark:shadow-card-dark',
        hover && [
          'cursor-pointer',
          'hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300',
          'dark:hover:border-slate-600 dark:hover:shadow-[0_4px_20px_rgba(0,0,0,.4)]',
        ],
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('flex items-center justify-between mb-4', className)}>{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{children}</h3>;
}
