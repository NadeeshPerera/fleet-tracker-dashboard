"use client";

import { useMemo, useState } from "react";
import type { Job } from "@/lib/types";
import { useFleetHub } from "@/realtime/RealtimeProvider";
import { useAppDispatch, useAppSelector } from "@/store";
import { idleTrucksByDistance, selectAllTrucks } from "@/store/selectors";
import { toastAdded } from "@/store/slices";

/** Lets a dispatcher allocate a pending job to an idle truck (nearest first). */
export function AllocateControl({ job }: { job: Job }) {
  const dispatch = useAppDispatch();
  const hub = useFleetHub();
  const trucks = useAppSelector(selectAllTrucks);
  const [busy, setBusy] = useState(false);

  const options = useMemo(() => idleTrucksByDistance(trucks, job.pickup.position), [trucks, job.pickup.position]);

  const allocate = async (truckId: string) => {
    if (!truckId) return;
    setBusy(true);
    const result = await hub.allocateJob(job.id, truckId);
    setBusy(false);
    const plate = trucks.find((t) => t.id === truckId)?.plate ?? truckId;
    dispatch(
      result.ok
        ? toastAdded(`${job.id} allocated to ${plate}`, "success")
        : toastAdded(`Could not allocate ${job.id}: ${result.error}`, "error"),
    );
  };

  if (options.length === 0) {
    return <span className="text-xs text-slate-400">No idle trucks</span>;
  }

  return (
    <select
      aria-label={`Allocate a truck to ${job.id}`}
      disabled={busy}
      value=""
      onChange={(e) => allocate(e.target.value)}
      className="w-40 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
    >
      <option value="">{busy ? "Allocating…" : "Allocate truck…"}</option>
      {options.map(({ truck, km }) => (
        <option key={truck.id} value={truck.id}>
          {truck.plate} · {km.toFixed(1)} km
        </option>
      ))}
    </select>
  );
}
