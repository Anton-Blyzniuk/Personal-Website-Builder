import React, { createContext, useCallback, useContext, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'info';

interface Toast { id: string; type: ToastType; message: string; }

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastType, { border: string; icon: string; bar: string }> = {
  success: { border: 'border-green-500/60',   icon: 'text-green-400',  bar: 'bg-green-500'  },
  error:   { border: 'border-red-500/60',     icon: 'text-red-400',    bar: 'bg-red-500'    },
  info:    { border: 'border-primary-500/60', icon: 'text-primary-400', bar: 'bg-primary-500' },
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5" />,
  error:   <AlertCircle  className="h-5 w-5" />,
  info:    <Info         className="h-5 w-5" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = Math.random().toString(36).slice(2);
      const MAX_TOASTS = 3;
      setToasts((prev) => [...prev, { id, type, message }].slice(-MAX_TOASTS));
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const success = useCallback((m: string) => toast('success', m), [toast]);
  const error   = useCallback((m: string) => toast('error',   m), [toast]);
  const info    = useCallback((m: string) => toast('info',    m), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const s = styles[t.type];
          return (
            <div
              key={t.id}
              className={clsx(
                'pointer-events-auto relative overflow-hidden',
                'flex items-start gap-3 rounded-xl p-4',
                'bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl',
                'border', s.border,
                'shadow-2xl animate-slide-in-right',
              )}
            >
              {/* Coloured left bar */}
              <div className={clsx('absolute left-0 top-0 bottom-0 w-0.5', s.bar)} />
              <span className={clsx('mt-0.5 shrink-0', s.icon)}>{icons[t.type]}</span>
              <p className="text-sm text-slate-200 flex-1 leading-relaxed">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
