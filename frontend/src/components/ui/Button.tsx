import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const base = [
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
  'transition-all duration-200 ease-spring',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
  'active:scale-[0.97]',
].join(' ');

const variants: Record<Variant, string> = {
  primary: clsx(
    'bg-primary-600 text-white',
    'hover:bg-primary-500 hover:shadow-glow-sm',
    'focus-visible:ring-primary-500',
    'dark:bg-primary-600 dark:hover:bg-primary-500',
  ),
  secondary: clsx(
    'bg-white text-slate-700 border border-slate-200',
    'hover:bg-slate-50 hover:border-slate-300',
    'focus-visible:ring-slate-400',
    'dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    'dark:hover:bg-slate-700 dark:hover:border-slate-600',
  ),
  danger: clsx(
    'bg-red-600 text-white',
    'hover:bg-red-500 hover:shadow-[0_0_14px_rgba(239,68,68,.35)]',
    'focus-visible:ring-red-500',
  ),
  ghost: clsx(
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    'focus-visible:ring-slate-400',
    'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
  ),
};

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 h-7',
  md: 'text-sm px-4 py-2 h-9',
  lg: 'text-base px-5 py-2.5 h-11',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], className)}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
