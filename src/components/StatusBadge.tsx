import { JOB_STATUS, TRUCK_STATUS } from "@/lib/status";
import type { JobStatus, TruckStatus } from "@/lib/types";

const base = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

export function TruckStatusBadge({ status }: { status: TruckStatus }) {
  const s = TRUCK_STATUS[status];
  return (
    <span className={`${base} ${s.badge}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const s = JOB_STATUS[status];
  return <span className={`${base} ${s.badge}`}>{s.label}</span>;
}
