"use client";

import { formatSGD } from "@/lib/format";
import { useAppSelector } from "@/store";
import { selectKpis } from "@/store/selectors";

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</dd>}
    </div>
  );
}

export function KpiCards() {
  const k = useAppSelector(selectKpis);
  const ready = k.totalTrucks > 0;
  const dash = "—";

  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Fleet summary">
      <Card
        label="Fleet utilisation"
        value={ready ? `${Math.round(k.utilisation * 100)}%` : dash}
        hint={ready ? `${k.busyTrucks} of ${k.totalTrucks} trucks working` : undefined}
      />
      <Card label="Active jobs" value={ready ? String(k.activeJobs) : dash} hint={ready ? `${k.pendingJobs} waiting for a truck` : undefined} />
      <Card label="Delivered" value={ready ? String(k.deliveredJobs) : dash} hint={ready ? `${k.deliveredTonnes} tonnes` : undefined} />
      <Card label="Revenue (excl. GST)" value={ready ? formatSGD(k.revenue) : dash} hint="From delivered jobs" />
    </dl>
  );
}
