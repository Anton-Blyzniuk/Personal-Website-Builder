import React, { useRef, useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Tab { id: string; label: string; icon?: React.ReactNode; }

interface TabsProps { tabs: Tab[]; active: string; onChange: (id: string) => void; }

export function Tabs({ tabs, active, onChange }: TabsProps) {
  const navRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  // Scroll active tab into view when it changes
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const activeBtn = el.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }, [active]);

  const scroll = (dir: 'left' | 'right') => {
    const el = navRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  };

  const handleWheel = (e: React.WheelEvent) => {
    const el = navRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollBy({ left: e.deltaY, behavior: 'instant' as ScrollBehavior });
    }
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-700/60 transition-theme relative">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-1
            bg-gradient-to-r from-white dark:from-slate-950 to-transparent
            text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <nav
        ref={navRef}
        onWheel={handleWheel}
        className="-mb-px flex gap-0.5 overflow-x-auto scrollbar-none px-1"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              data-active={isActive}
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

      {/* Right arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 flex items-center px-1
            bg-gradient-to-l from-white dark:from-slate-950 to-transparent
            text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
