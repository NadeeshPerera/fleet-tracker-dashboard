"use client";

import { memo } from "react";
import { formatEta, formatSGD, formatTime } from "@/lib/format";
import { calculateInvoice } from "@/lib/invoiceMath";
import type { Job, JobFilter } from "@/lib/types";
import { useFlashOnChange } from "@/hooks/useFlashOnChange";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectJobCounts, selectVisibleJobs } from "@/store/selectors";
import { jobFilterChanged, searchChanged } from "@/store/slices";
import { JobStatusBadge } from "../StatusBadge";
import { AllocateControl } from "./AllocateControl";
import { InvoiceButton } from "./InvoiceButton";

const FILTERS: { value: JobFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "delivered", label: "Delivered" },
];

const JobRow = memo(function JobRow({ job, plate }: { job: Job; plate: string | undefined }) {
  // Highlight the row briefly when its status changes (server push).
  const flashing = useFlashOnChange(job.status);
  return (
    <tr className={`border-t border-slate-100 transition-colors duration-700 dark:border-slate-800 ${flashing ? "bg-amber-50 dark:bg-amber-950" : ""}`}>
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{job.id}</td>
      <td className="px-3 py-2.5">
        <div className="text-sm text-slate-900 dark:text-slate-100">{job.customer}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {job.material} · {job.tonnes} t
        </div>
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300">
        <div>{job.pickup.name}</div>
        <div className="text-slate-500 dark:text-slate-400">→ {job.dropoff.name}</div>
      </td>
      <td className="px-3 py-2.5">
        <JobStatusBadge status={job.status} />
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">{plate ?? "—"}</td>
      <td className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums text-slate-700 dark:text-slate-300">
        {job.status === "delivered" && job.deliveredAt ? formatTime(job.deliveredAt) : formatEta(job.etaMinutes)}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm tabular-nums text-slate-900 dark:text-slate-100">
        {formatSGD(calculateInvoice(job).total)}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-right">
        {job.status === "pending" && <AllocateControl job={job} />}
        {job.status === "delivered" && <InvoiceButton job={job} />}
      </td>
    </tr>
  );
});

export function JobsTable() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector(selectVisibleJobs);
  const counts = useAppSelector(selectJobCounts);
  const filter = useAppSelector((s) => s.ui.jobFilter);
  const search = useAppSelector((s) => s.ui.search);
  const trucksById = useAppSelector((s) => s.trucks.entities);

  return (
    <section aria-labelledby="jobs-heading" className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3 dark:border-slate-800">
        <h2 id="jobs-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Jobs
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filter jobs by status" className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => dispatch(jobFilterChanged(f.value))}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
                  filter === f.value
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-50"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                }`}
              >
                {f.label} <span className="tabular-nums text-slate-500 dark:text-slate-400">{counts[f.value]}</span>
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => dispatch(searchChanged(e.target.value))}
            placeholder="Search jobs, customers, sites, plates"
            aria-label="Search jobs"
            className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Job</th>
              <th scope="col" className="px-3 py-2 font-medium">Customer / material</th>
              <th scope="col" className="px-3 py-2 font-medium">Route</th>
              <th scope="col" className="px-3 py-2 font-medium">Status</th>
              <th scope="col" className="px-3 py-2 font-medium">Truck</th>
              <th scope="col" className="px-3 py-2 font-medium">ETA / delivered</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Total (incl. GST)</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} plate={job.truckId ? trucksById[job.truckId]?.plate : undefined} />
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No jobs match this view.</p>}
      </div>
    </section>
  );
}
