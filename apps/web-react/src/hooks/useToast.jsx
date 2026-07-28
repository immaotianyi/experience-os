/**
 * useToast — toast queue context + hook.
 */
import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Set());

  // Clean up all pending timers on unmount to prevent state updates
  // on unmounted components (e.g., during hot-reload or tests).
  useEffect(() => {
    return () => {
      for (const id of timersRef.current) clearTimeout(id);
      timersRef.current.clear();
    };
  }, []);

  const setTimer = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
    setTimer(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, [setTimer]);

  const toast = useCallback((message, variant = "ok", title) => {
    const id = `toast.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, variant, title, leaving: false }]);
    setTimer(() => dismiss(id), 3500);
  }, [dismiss, setTimer]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.variant} ${t.leaving ? "leaving" : ""}`} onClick={() => dismiss(t.id)}>
            {t.title && <strong>{t.title}</strong>}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
