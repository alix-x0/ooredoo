import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => {
      const filtered = prev.filter((t) => t.message !== message);
      return [...filtered, { id, message, type }];
    });
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const toast = useMemo(() => ({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
    loading: (msg) => addToast(msg, 'loading'),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    loading: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
  };

  const styles = {
    success: 'border-emerald-100 bg-white dark:bg-slate-900',
    error: 'border-red-100 bg-white dark:bg-slate-900',
    info: 'border-red-100 bg-white dark:bg-slate-900',
    warning: 'border-amber-100 bg-white dark:bg-slate-900',
    loading: 'border-primary/20 bg-white dark:bg-slate-900',
  };

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-2xl border shadow-xl transition-all duration-200 ease-out transform
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}
        ${styles[toast.type]}
      `}
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <p className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className="shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <X className="h-4 w-4 text-slate-400" />
      </button>
    </div>
  );
};
