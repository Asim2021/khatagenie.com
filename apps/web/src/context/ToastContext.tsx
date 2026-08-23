import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from '../components/icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: {
    (toast: Omit<Toast, 'id'>): void;
    (title: string, type?: ToastType, message?: string, duration?: number): void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      arg1: Omit<Toast, 'id'> | string,
      arg2?: ToastType,
      arg3?: string,
      arg4: number = 4000
    ) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      let toastItem: Toast;

      if (typeof arg1 === 'string') {
        toastItem = {
          id,
          title: arg1,
          type: arg2 || 'info',
          message: arg3,
          duration: arg4,
        };
      } else {
        toastItem = {
          id,
          type: arg1.type || 'info',
          title: arg1.title,
          message: arg1.message,
          duration: arg1.duration ?? 4000,
        };
      }

      setToasts((prev) => [...prev, toastItem]);

      if (toastItem.duration && toastItem.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, toastItem.duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-3.5 sm:top-6 sm:right-6 z-[9999] flex flex-col space-y-2.5 max-w-sm sm:max-w-md w-[calc(100%-1.75rem)] pointer-events-none safe-pt">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all animate-in slide-in-from-top-3 duration-300 overflow-hidden ${
                isSuccess
                  ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/30 text-slate-900 dark:text-slate-100 shadow-emerald-950/10'
                  : isError
                  ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/30 text-slate-900 dark:text-slate-100 shadow-rose-950/10'
                  : isWarning
                  ? 'bg-white/95 dark:bg-slate-900/95 border-amber-500/30 text-slate-900 dark:text-slate-100 shadow-amber-950/10'
                  : 'bg-white/95 dark:bg-slate-900/95 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
              }`}
            >
              {/* Left Color Indicator Bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isSuccess
                    ? 'bg-emerald-500'
                    : isError
                    ? 'bg-rose-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
              />

              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5 pl-1">
                {isSuccess && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}
                {isError && (
                  <div className="w-7 h-7 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}
                {isWarning && (
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}
                {!isSuccess && !isError && !isWarning && (
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <Info className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 text-xs sm:text-sm min-w-0 pr-1">
                <h4 className="font-bold text-slate-900 dark:text-white leading-tight break-words">
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed break-words">
                    {toast.message}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
