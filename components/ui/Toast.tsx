'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface ToastMessage {
  id: string;
  text: string;
  undoAction?: () => void;
  duration?: number;
}

interface ToastContextType {
  toast: (text: string, options?: { undoAction?: () => void; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((text: string, options?: { undoAction?: () => void; duration?: number }) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, text, ...options }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleUndo = useCallback((t: ToastMessage) => {
    t.undoAction?.();
    dismiss(t.id);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — fixed bottom center */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9998] flex flex-col gap-2 pointer-events-auto" aria-live="polite">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} onUndo={() => handleUndo(t)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast: t, onDismiss, onUndo }: { toast: ToastMessage; onDismiss: () => void; onUndo: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, t.duration || 4000);
    return () => clearTimeout(timer);
  }, [t.duration, onDismiss]);

  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <span>{t.text}</span>
      {t.undoAction && (
        <button
          onClick={onUndo}
          className="font-bold uppercase tracking-wider underline hover:opacity-75 transition-opacity"
        >
          Undo
        </button>
      )}
      <button
        onClick={onDismiss}
        className="opacity-50 hover:opacity-100 transition-opacity ml-1"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}
