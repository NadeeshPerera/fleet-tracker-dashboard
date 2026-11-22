import type { JobStatus, TruckStatus } from "./types";

export const TRUCK_STATUS: Record<TruckStatus, { label: string; color: string; badge: string }> = {
  idle: { label: "Idle", color: "#64748b", badge: "bg-slate-100 text-slate-700 ring-slate-300" },
  to_pickup: { label: "To pickup", color: "#d97706", badge: "bg-amber-50 text-amber-800 ring-amber-300" },
  loading: { label: "Loading", color: "#7c3aed", badge: "bg-violet-50 text-violet-800 ring-violet-300" },
  in_transit: { label: "In transit", color: "#2563eb", badge: "bg-blue-50 text-blue-800 ring-blue-300" },
};

export const JOB_STATUS: Record<JobStatus, { label: string; badge: string }> = {
  pending: { label: "Pending", badge: "bg-amber-50 text-amber-800 ring-amber-300" },
  allocated: { label: "Allocated", badge: "bg-sky-50 text-sky-800 ring-sky-300" },
  loading: { label: "Loading", badge: "bg-violet-50 text-violet-800 ring-violet-300" },
  in_transit: { label: "In transit", badge: "bg-blue-50 text-blue-800 ring-blue-300" },
  delivered: { label: "Delivered", badge: "bg-emerald-50 text-emerald-800 ring-emerald-300" },
};

export const ACTIVE_JOB_STATUSES: readonly JobStatus[] = ["allocated", "loading", "in_transit"];
