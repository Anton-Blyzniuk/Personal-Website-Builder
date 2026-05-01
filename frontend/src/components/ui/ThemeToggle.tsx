import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { clsx } from 'clsx';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={clsx(
        'relative h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200',
        'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60',
        'dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/60',
        'light-mode:text-slate-500 light-mode:hover:text-slate-700 light-mode:hover:bg-slate-100',
        className
      )}
    >
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
        }}
      >
        <Moon className="h-4 w-4" />
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'rotate(-90deg) scale(0)' : 'rotate(0deg) scale(1)',
        }}
      >
        <Sun className="h-4 w-4" />
      </span>
    </button>
  );
}
