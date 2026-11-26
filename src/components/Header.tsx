"use client";

import { formatTime } from "@/lib/format";
import { useFleetHub } from "@/realtime/RealtimeProvider";
import { useAppDispatch, useAppSelector } from "@/store";
import { autoDispatchToggled, toastAdded } from "@/store/slices";
import { ThemeToggle } from "./ThemeToggle";

function ConnectionBadge() {
  const { status, attempt, retryInMs, lastMessageAt } = useAppSelector((s) => s.connection);

  const view = {
    connected: { dot: "bg-emerald-500", label: "Live" },
    connecting: { dot: "bg-amber-400 animate-pulse", label: "Connecting…" },
    reconnecting: {
      dot: "bg-amber-400 animate-pulse",
      label: `Reconnecting${retryInMs ? ` in ${Math.round(retryInMs / 1000)}s` : "…"} (attempt ${attempt})`,
    },
    disconnected: { dot: "bg-red-500", label: "Offline" },
  }[status];

  return (
    <div className="flex items-center gap-3 text-sm" role="status" aria-live="polite">
      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium">
        <span className={`relative h-2.5 w-2.5 rounded-full ${view.dot}`}>
          {status === "connected" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
          )}
        </span>
        {view.label}
      </span>
      {lastMessageAt && (
        <span className="hidden text-slate-300 sm:inline">Last update {formatTime(lastMessageAt)}</span>
      )}
    </div>
  );
}

export function Header() {
  const dispatch = useAppDispatch();
  const hub = useFleetHub();
  const autoDispatch = useAppSelector((s) => s.ui.autoDispatch);
  const isConnected = useAppSelector((s) => s.connection.status === "connected");

  const toggleAutoDispatch = () => {
    const next = !autoDispatch;
    hub.setAutoDispatch(next);
    dispatch(autoDispatchToggled(next));
  };

  const dropConnection = () => {
    hub.simulateNetworkDrop();
    dispatch(toastAdded("Connection dropped. Reconnecting with exponential backoff…", "info"));
  };

  return (
    <header className="bg-slate-900 text-white dark:border-b dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Fleet Tracker · Singapore</h1>
          <p className="text-xs text-slate-400">Real-time dispatch demo · 1 real second = 1 simulated minute</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ConnectionBadge />

          <button
            type="button"
            role="switch"
            aria-checked={autoDispatch}
            onClick={toggleAutoDispatch}
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <span
              aria-hidden
              className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${autoDispatch ? "bg-sky-500" : "bg-slate-600"}`}
            >
              <span
                className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${autoDispatch ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </span>
            Auto-dispatch
          </button>

          <button
            type="button"
            onClick={dropConnection}
            disabled={!isConnected}
            className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            Simulate network drop
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
