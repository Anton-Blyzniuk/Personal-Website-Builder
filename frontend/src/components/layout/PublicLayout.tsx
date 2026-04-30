import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LogoMark } from '../ui/Logo';
import { useAuthStore } from '../../store/authStore';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-theme">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/60 transition-theme">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <LogoMark className="h-8 w-8 shrink-0 group-hover:scale-105 transition-transform duration-200" />
            <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-tight">PWB</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/docs"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-150"
            >
              Docs
            </Link>

            {isAuthenticated ? (
              <>
                {user && (
                  <span className="hidden sm:block text-sm text-slate-500 dark:text-slate-400 px-2">
                    Hi, <strong className="text-slate-700 dark:text-slate-200">{user.first_name}</strong>
                  </span>
                )}
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-500 hover:shadow-glow-sm transition-all duration-200 active:scale-[0.97]"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-150"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-500 hover:shadow-glow-sm transition-all duration-200 active:scale-[0.97]"
                >
                  Get started
                </Link>
              </>
            )}

            <ThemeToggle className="ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-white/60 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800/60 py-6 transition-theme">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-slate-500 dark:text-slate-600">
          &copy; {new Date().getFullYear()} Personal Website Builder
        </div>
      </footer>
    </div>
  );
}
