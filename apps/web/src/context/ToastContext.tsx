import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

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
      <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex flex-col space-y-2 max-w-md w-[calc(100%-2rem)] sm:w-full pointer-events-none px-2 sm:px-4 safe-pb">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-2xl shadow-xl border transition-all animate-in slide-in-from-bottom-2 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-500/30 text-rose-950 dark:text-rose-100'
                : toast.type === 'warning'
                ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-300 dark:border-amber-500/30 text-amber-950 dark:text-amber-100'
                : 'bg-white/95 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-100'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              )}
              {toast.type === 'warning' && (
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              )}
            </div>
            <div className="flex-1 text-xs sm:text-sm">
              <h4 className="font-bold">{toast.title}</h4>
              {toast.message && <p className="mt-0.5 text-xs opacity-90">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
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
