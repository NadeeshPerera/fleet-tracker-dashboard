"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { toastDismissed, type Toast } from "@/store/slices";

const TONE: Record<Toast["tone"], string> = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  error: "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
  info: "border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
};

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const timer = setTimeout(() => dispatch(toastDismissed(toast.id)), 4000);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <li className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${TONE[toast.tone]}`}>
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dispatch(toastDismissed(toast.id))}
        className="text-current opacity-60 hover:opacity-100"
      >
        ×
      </button>
    </li>
  );
}

export function Toaster() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  return (
    <ol aria-live="polite" className="fixed bottom-4 right-4 z-[1000] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </ol>
  );
}
