import React from 'react';
import { clsx } from 'clsx';

interface Tab { id: string; label: string; icon?: React.ReactNode; }

interface TabsProps { tabs: Tab[]; active: string; onChange: (id: string) => void; }

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-700/60 transition-theme">
      <nav className="-mb-px flex gap-0.5 overflow-x-auto scrollbar-none px-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap rounded-t-lg',
                'border-b-2 transition-all duration-200',
                isActive
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/30'
                  : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600',
              )}
            >
              {tab.icon && (
                <span className={clsx('transition-colors duration-200', isActive ? 'text-primary-500' : '')}>
                  {tab.icon}
                </span>
              )}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
