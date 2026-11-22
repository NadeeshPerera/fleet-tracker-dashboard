import { createSelector } from "@reduxjs/toolkit";
import { calculateInvoice } from "@/lib/invoiceMath";
import { distanceKm } from "@/lib/geo";
import { ACTIVE_JOB_STATUSES } from "@/lib/status";
import type { Job, JobFilter, LatLng, Truck } from "@/lib/types";
import type { RootState } from "./index";
import { jobsAdapter, trucksAdapter } from "./slices";

export const { selectAll: selectAllTrucks, selectById: selectTruckById } = trucksAdapter.getSelectors(
  (state: RootState) => state.trucks,
);
export const { selectAll: selectAllJobs, selectById: selectJobById } = jobsAdapter.getSelectors(
  (state: RootState) => state.jobs,
);

export const selectJobFilter = (state: RootState) => state.ui.jobFilter;
export const selectSearch = (state: RootState) => state.ui.search;
export const selectSelectedTruckId = (state: RootState) => state.ui.selectedTruckId;

export const selectSelectedTruck = (state: RootState) => {
  const id = selectSelectedTruckId(state);
  return id ? selectTruckById(state, id) ?? null : null;
};

const isActive = (job: Job) => ACTIVE_JOB_STATUSES.includes(job.status);

export function matchesFilter(job: Job, filter: JobFilter): boolean {
  if (filter === "all") return true;
  if (filter === "active") return isActive(job);
  return job.status === filter;
}

export const selectKpis = createSelector([selectAllTrucks, selectAllJobs], (trucks, jobs) => {
  const delivered = jobs.filter((j) => j.status === "delivered");
  const busyTrucks = trucks.filter((t) => t.status !== "idle").length;
  return {
    totalTrucks: trucks.length,
    busyTrucks,
    utilisation: trucks.length ? busyTrucks / trucks.length : 0,
    pendingJobs: jobs.filter((j) => j.status === "pending").length,
    activeJobs: jobs.filter(isActive).length,
    deliveredJobs: delivered.length,
    deliveredTonnes: delivered.reduce((sum, j) => sum + j.tonnes, 0),
    revenue: delivered.reduce((sum, j) => sum + calculateInvoice(j).subtotal, 0),
  };
});

export const selectJobCounts = createSelector([selectAllJobs], (jobs) => {
  const counts: Record<JobFilter, number> = { all: jobs.length, pending: 0, active: 0, delivered: 0 };
  for (const job of jobs) {
    if (job.status === "pending") counts.pending++;
    else if (job.status === "delivered") counts.delivered++;
    else counts.active++;
  }
  return counts;
});

const STATUS_PRIORITY: Record<Job["status"], number> = {
  pending: 0,
  allocated: 1,
  loading: 1,
  in_transit: 1,
  delivered: 2,
};

export const selectVisibleJobs = createSelector(
  [selectAllJobs, selectJobFilter, selectSearch, (state: RootState) => state.trucks.entities],
  (jobs, filter, search, trucksById) => {
    const q = search.trim().toLowerCase();
    return jobs
      .filter((job) => matchesFilter(job, filter))
      .filter((job) => {
        if (!q) return true;
        const plate = job.truckId ? trucksById[job.truckId]?.plate ?? "" : "";
        return [job.id, job.customer, job.material, job.pickup.name, job.dropoff.name, plate].some((field) =>
          field.toLowerCase().includes(q),
        );
      })
      .sort((a, b) => {
        const byStatus = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
        if (byStatus !== 0) return byStatus;
        if (a.status === "delivered") return (b.deliveredAt ?? 0) - (a.deliveredAt ?? 0);
        return b.createdAt - a.createdAt;
      });
  },
);

// Stable order (by plate): re-sorting by live status every second would move
// items out from under the dispatcher's cursor.
export const selectSortedTrucks = createSelector([selectAllTrucks], (trucks) =>
  [...trucks].sort((a, b) => a.plate.localeCompare(b.plate)),
);

/** Idle trucks ordered by distance to a point — used for allocation suggestions. */
export function idleTrucksByDistance(trucks: Truck[], to: LatLng) {
  return trucks
    .filter((t) => t.status === "idle")
    .map((truck) => ({ truck, km: distanceKm(truck.position, to) }))
    .sort((a, b) => a.km - b.km);
}
