"use client";

import { memo, useMemo, useState } from "react";
import { formatEta } from "@/lib/format";
import type { Job, Truck } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectSelectedTruckId, selectSortedTrucks } from "@/store/selectors";
import { truckSelected } from "@/store/slices";
import { TruckStatusBadge } from "./StatusBadge";

const TruckItem = memo(function TruckItem({
  truck,
  job,
  selected,
  onSelect,
}: {
  truck: Truck;
  job: Job | undefined;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const destination = job ? (truck.status === "to_pickup" ? job.pickup.name : job.dropoff.name) : null;
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(truck.id)}
        className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
          selected
            ? "border-sky-400 bg-sky-50 dark:border-sky-500 dark:bg-sky-950"
            : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{truck.plate}</span>
          <TruckStatusBadge status={truck.status} />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{truck.driver}</span>
          {truck.speedKmh > 0 && <span className="tabular-nums">{Math.round(truck.speedKmh)} km/h</span>}
        </div>
        {job && destination && (
          <div className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">
            {job.id} → {destination}
            {job.etaMinutes !== null && <span className="text-slate-500 dark:text-slate-400"> · ETA {formatEta(job.etaMinutes)}</span>}
          </div>
        )}
      </button>
    </li>
  );
});

export function TruckList() {
  const dispatch = useAppDispatch();
  const trucks = useAppSelector(selectSortedTrucks);
  const jobsById = useAppSelector((s) => s.jobs.entities);
  const selectedId = useAppSelector(selectSelectedTruckId);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trucks;
    return trucks.filter((t) => t.plate.toLowerCase().includes(q) || t.driver.toLowerCase().includes(q));
  }, [trucks, query]);

  const onSelect = (id: string) => dispatch(truckSelected(id));

  return (
    <section aria-labelledby="trucks-heading" className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:h-[520px]">
      <div className="border-b border-slate-200 p-3 dark:border-slate-800">
        <h2 id="trucks-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Trucks <span className="font-normal text-slate-500 dark:text-slate-400">({trucks.length})</span>
        </h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plate or driver"
          aria-label="Search trucks"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>
      {trucks.length === 0 ? (
        <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Connecting to fleet…</p>
      ) : visible.length === 0 ? (
        <p className="p-4 text-sm text-slate-500 dark:text-slate-400">No trucks match “{query}”.</p>
      ) : (
        <ul className="flex-1 space-y-1 overflow-y-auto p-2">
          {visible.map((truck) => (
            <TruckItem
              key={truck.id}
              truck={truck}
              job={truck.jobId ? jobsById[truck.jobId] : undefined}
              selected={truck.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
