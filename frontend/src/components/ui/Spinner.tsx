import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('animate-spin', className ?? 'h-6 w-6 text-primary-500')} />;
}

export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-2 border-slate-200 dark:border-slate-800" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-t-primary-500 animate-spin" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-500 animate-pulse">Loading…</p>
    </div>
  );
}
