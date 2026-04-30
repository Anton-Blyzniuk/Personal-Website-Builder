import { clsx } from 'clsx';

type Color = 'gray' | 'indigo' | 'green' | 'red' | 'amber';

const colors: Record<Color, string> = {
  gray:   'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  indigo: 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
  green:  'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  red:    'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  amber:  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
};

export function Badge({
  children,
  color = 'gray',
  className,
}: {
  children: React.ReactNode;
  color?: Color;
  className?: string;
}) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-theme',
      colors[color],
      className,
    )}>
      {children}
    </span>
  );
}
