import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutGrid, Key, BookOpen, LogOut, Menu, X, ChevronRight, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LogoMark } from '../ui/Logo';
import { PLAN_LABELS, PLAN_BADGE_COLORS } from '../../types/api';

interface NavItem { to: string; icon: React.ReactNode; label: string; }

const navItems: NavItem[] = [
  { to: '/dashboard',          icon: <LayoutGrid className="h-4 w-4" />, label: 'My PWBUnits'    },
  { to: '/dashboard/plans',    icon: <Layers     className="h-4 w-4" />, label: 'Plans'           },
  { to: '/dashboard/api-keys', icon: <Key        className="h-4 w-4" />, label: 'API Credentials' },
  { to: '/docs',               icon: <BookOpen   className="h-4 w-4" />, label: 'API Docs'        },
];


function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <Link to="/dashboard" className="flex items-center gap-3 flex-1 min-w-0 group" onClick={onClose}>
          <LogoMark className="h-8 w-8 shrink-0 group-hover:scale-105 transition-transform duration-200" />
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-none tracking-tight">PWB</p>
            <p className="text-slate-500 text-xs mt-0.5">Website Builder</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 stagger-children">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={clsx('transition-colors duration-150', isActive ? 'text-primary-400' : 'text-slate-600 group-hover:text-slate-300')}>
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: theme toggle + user */}
      <div className="px-3 py-4 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-xs text-slate-600 flex-1">Theme</span>
          <ThemeToggle />
        </div>

        {user && (
          <NavLink
            to="/dashboard/profile"
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 group',
                isActive
                  ? 'bg-primary-600/20 border-primary-500/20'
                  : 'border-transparent hover:bg-white/5',
              )
            }
          >
            {({ isActive }) => (
              <>
                {user.profile_picture ? (
                  <img src={user.profile_picture} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-primary-500/30 shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {user.first_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className={clsx('text-xs font-semibold truncate transition-colors duration-150', isActive ? 'text-primary-400' : 'text-slate-200')}>
                      {user.first_name} {user.last_name}
                    </p>
                    <span className={clsx('text-[9px] font-bold px-1.5 py-px rounded-full border shrink-0', PLAN_BADGE_COLORS[user.plan])}>
                      {PLAN_LABELS[user.plan]}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs truncate">{user.email}</p>
                </div>
                <ChevronRight className={clsx('h-3.5 w-3.5 shrink-0 transition-all duration-150', isActive ? 'text-primary-400' : 'text-slate-700 group-hover:text-slate-500')} />
              </>
            )}
          </NavLink>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 border border-transparent hover:border-red-500/20"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-theme">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 bg-[#0a0a0f] border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 z-40 lg:hidden"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-60 h-full bg-[#0a0a0f] border-r border-white/5 animate-slide-in-left">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 transition-theme">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2 flex-1">
            <LogoMark className="h-7 w-7 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-tight">PWB</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
