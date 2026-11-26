import type { JobStatus, TruckStatus } from "./types";

// Badge colours. Text/background pairs meet WCAG AA (4.5:1) in both themes; see status.test.ts.
const AMBER = "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800";
const VIOLET = "bg-violet-50 text-violet-800 ring-violet-300 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-800";
const BLUE = "bg-blue-50 text-blue-800 ring-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-800";

export const TRUCK_STATUS: Record<TruckStatus, { label: string; color: string; badge: string }> = {
  idle: { label: "Idle", color: "#64748b", badge: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600" },
  to_pickup: { label: "To pickup", color: "#d97706", badge: AMBER },
  loading: { label: "Loading", color: "#7c3aed", badge: VIOLET },
  in_transit: { label: "In transit", color: "#2563eb", badge: BLUE },
};

export const JOB_STATUS: Record<JobStatus, { label: string; badge: string }> = {
  pending: { label: "Pending", badge: AMBER },
  allocated: { label: "Allocated", badge: "bg-sky-50 text-sky-800 ring-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800" },
  loading: { label: "Loading", badge: VIOLET },
  in_transit: { label: "In transit", badge: BLUE },
  delivered: { label: "Delivered", badge: "bg-emerald-50 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800" },
};

export const ACTIVE_JOB_STATUSES: readonly JobStatus[] = ["allocated", "loading", "in_transit"];
