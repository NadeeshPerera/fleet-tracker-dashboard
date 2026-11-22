/**
 * Fleet simulation engine — plays the role of the backend.
 *
 * Pure-ish functions that mutate an `EngineState` owned by the (mock) server and
 * report which entities changed, so the hub can push small deltas to clients.
 * Everything time-related takes `now` and an `rng` so it is deterministic in tests.
 */
import { bearing, distanceKm, moveTowards } from "@/lib/geo";
import type { Job, LatLng, Truck } from "@/lib/types";
import { CUSTOMERS, DEPOTS, MATERIALS, SITES, TRUCKS } from "./seed";

/** 1 real second = 1 simulated minute. */
export const TIME_SCALE = 60;
export const LOADING_MS = 4_000;
export const JOB_SPAWN_MS = 12_000;
export const MAX_PENDING_JOBS = 5;
export const AUTO_DISPATCH_DELAY_MS = 8_000;
const AVG_SPEED_KMH = 50;

export type Rng = () => number;

export interface EngineState {
  trucks: Record<string, Truck>;
  jobs: Record<string, Job>;
  jobSeq: number;
  lastJobSpawnAt: number;
  loadingUntil: Record<string, number>;
  autoDispatch: boolean;
}

export interface Changes {
  trucks: Truck[];
  jobs: Job[];
}

export type AllocateResult = { ok: true; changes: Changes } | { ok: false; error: string };

/** Small seeded PRNG (mulberry32) so simulations are reproducible. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)];
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Simulated minutes until the job is delivered, based on remaining distance. */
export function estimateEtaMinutes(truck: Truck, job: Job): number {
  const speed = truck.speedKmh > 0 ? truck.speedKmh : AVG_SPEED_KMH;
  const loadingMinutes = (LOADING_MS / 1000) * (TIME_SCALE / 60);
  let km: number;
  let extra = 0;
  if (job.status === "allocated") {
    km = distanceKm(truck.position, job.pickup.position) + distanceKm(job.pickup.position, job.dropoff.position);
    extra = loadingMinutes;
  } else if (job.status === "loading") {
    km = distanceKm(job.pickup.position, job.dropoff.position);
    extra = loadingMinutes;
  } else {
    km = distanceKm(truck.position, job.dropoff.position);
  }
  return Math.round((km / speed) * 60 + extra);
}

/** Closest idle truck to a point, or null if none are free. */
export function findNearestIdleTruck(trucks: Iterable<Truck>, to: LatLng): Truck | null {
  let best: Truck | null = null;
  let bestKm = Infinity;
  for (const truck of trucks) {
    if (truck.status !== "idle") continue;
    const km = distanceKm(truck.position, to);
    if (km < bestKm) {
      best = truck;
      bestKm = km;
    }
  }
  return best;
}

export function createJob(state: EngineState, now: number, rng: Rng): Job {
  const material = pick(Object.keys(MATERIALS), rng);
  const pickup = pick(DEPOTS, rng);
  const dropoff = pick(SITES, rng);
  state.jobSeq += 1;
  const job: Job = {
    id: `JOB-${1000 + state.jobSeq}`,
    customer: pick(CUSTOMERS, rng),
    material,
    tonnes: 10 + Math.floor(rng() * 23),
    pricePerTonne: MATERIALS[material],
    pickup,
    dropoff,
    status: "pending",
    truckId: null,
    createdAt: now,
    updatedAt: now,
    deliveredAt: null,
    etaMinutes: null,
  };
  state.jobs[job.id] = job;
  return job;
}

function assign(state: EngineState, job: Job, truck: Truck, now: number) {
  job.status = "allocated";
  job.truckId = truck.id;
  job.updatedAt = now;
  truck.status = "to_pickup";
  truck.jobId = job.id;
  truck.speedKmh = AVG_SPEED_KMH;
  truck.heading = bearing(truck.position, job.pickup.position);
  truck.updatedAt = now;
  job.etaMinutes = estimateEtaMinutes(truck, job);
}

/** Server-side validation + allocation, like a hub method invoked by the client. */
export function allocateJob(state: EngineState, jobId: string, truckId: string, now: number): AllocateResult {
  const job = state.jobs[jobId];
  const truck = state.trucks[truckId];
  if (!job) return { ok: false, error: `Job ${jobId} not found` };
  if (!truck) return { ok: false, error: `Truck ${truckId} not found` };
  if (job.status !== "pending") return { ok: false, error: `${job.id} is already ${job.status.replace("_", " ")}` };
  if (truck.status !== "idle") return { ok: false, error: `${truck.plate} is no longer idle` };
  assign(state, job, truck, now);
  return { ok: true, changes: { trucks: [truck], jobs: [job] } };
}

export function createInitialState(now: number, rng: Rng): EngineState {
  const state: EngineState = {
    trucks: {},
    jobs: {},
    jobSeq: 0,
    lastJobSpawnAt: now,
    loadingUntil: {},
    autoDispatch: true,
  };

  TRUCKS.forEach((t, i) => {
    const depot = DEPOTS[i % DEPOTS.length];
    const id = `T${i + 1}`;
    state.trucks[id] = {
      id,
      plate: t.plate,
      driver: t.driver,
      capacityTonnes: 32,
      position: {
        lat: depot.position.lat + (rng() - 0.5) * 0.004,
        lng: depot.position.lng + (rng() - 0.5) * 0.004,
      },
      heading: 0,
      speedKmh: 0,
      status: "idle",
      jobId: null,
      updatedAt: now,
    };
  });

  // A couple of delivered jobs so invoices are available straight away.
  for (let i = 0; i < 2; i++) {
    const job = createJob(state, now - (90 - i * 30) * 60_000, rng);
    job.status = "delivered";
    job.truckId = `T${i + 1}`;
    job.deliveredAt = now - (40 - i * 20) * 60_000;
    job.updatedAt = job.deliveredAt;
    job.etaMinutes = 0;
  }

  // Three trucks already part-way through a delivery.
  for (let i = 2; i < 5; i++) {
    const truck = state.trucks[`T${i + 1}`];
    const job = createJob(state, now - 20 * 60_000, rng);
    assign(state, job, truck, now);
    const progress = 0.2 + rng() * 0.5;
    truck.position = {
      lat: job.pickup.position.lat + (job.dropoff.position.lat - job.pickup.position.lat) * progress,
      lng: job.pickup.position.lng + (job.dropoff.position.lng - job.pickup.position.lng) * progress,
    };
    truck.status = "in_transit";
    truck.heading = bearing(truck.position, job.dropoff.position);
    job.status = "in_transit";
    job.etaMinutes = estimateEtaMinutes(truck, job);
  }

  for (let i = 0; i < 3; i++) createJob(state, now - i * 2_000, rng);
  return state;
}

/** Advance the simulation by `dtMs` of real time. Returns the entities that changed. */
export function tick(state: EngineState, now: number, dtMs: number, rng: Rng): Changes {
  const changedTrucks = new Set<string>();
  const changedJobs = new Set<string>();
  const simHours = ((dtMs / 1000) * TIME_SCALE) / 3600;

  for (const truck of Object.values(state.trucks)) {
    const job = truck.jobId ? state.jobs[truck.jobId] : undefined;
    if (!job) continue;

    if (truck.status === "loading") {
      if (now >= (state.loadingUntil[truck.id] ?? 0)) {
        delete state.loadingUntil[truck.id];
        truck.status = "in_transit";
        truck.speedKmh = AVG_SPEED_KMH;
        truck.heading = bearing(truck.position, job.dropoff.position);
        truck.updatedAt = now;
        job.status = "in_transit";
        job.updatedAt = now;
        job.etaMinutes = estimateEtaMinutes(truck, job);
        changedTrucks.add(truck.id);
        changedJobs.add(job.id);
      }
      continue;
    }

    if (truck.status !== "to_pickup" && truck.status !== "in_transit") continue;

    const target = truck.status === "to_pickup" ? job.pickup.position : job.dropoff.position;
    truck.speedKmh = clamp(truck.speedKmh + (rng() - 0.5) * 8, 35, 70);
    const { position, arrived } = moveTowards(truck.position, target, truck.speedKmh * simHours);
    if (!arrived) truck.heading = bearing(truck.position, target);
    truck.position = position;
    truck.updatedAt = now;
    changedTrucks.add(truck.id);
    changedJobs.add(job.id);

    if (arrived && truck.status === "to_pickup") {
      truck.status = "loading";
      truck.speedKmh = 0;
      state.loadingUntil[truck.id] = now + LOADING_MS;
      job.status = "loading";
      job.updatedAt = now;
    } else if (arrived) {
      truck.status = "idle";
      truck.speedKmh = 0;
      truck.jobId = null;
      job.status = "delivered";
      job.deliveredAt = now;
      job.updatedAt = now;
      job.etaMinutes = 0;
      continue;
    }
    job.etaMinutes = estimateEtaMinutes(truck, job);
  }

  const pending = Object.values(state.jobs).filter((j) => j.status === "pending");

  if (now - state.lastJobSpawnAt >= JOB_SPAWN_MS && pending.length < MAX_PENDING_JOBS) {
    const job = createJob(state, now, rng);
    state.lastJobSpawnAt = now;
    pending.push(job);
    changedJobs.add(job.id);
  }

  if (state.autoDispatch) {
    const ready = pending
      .filter((j) => now - j.createdAt >= AUTO_DISPATCH_DELAY_MS)
      .sort((a, b) => a.createdAt - b.createdAt);
    for (const job of ready) {
      const truck = findNearestIdleTruck(Object.values(state.trucks), job.pickup.position);
      if (!truck) break;
      assign(state, job, truck, now);
      changedTrucks.add(truck.id);
      changedJobs.add(job.id);
    }
  }

  return {
    trucks: [...changedTrucks].map((id) => state.trucks[id]),
    jobs: [...changedJobs].map((id) => state.jobs[id]),
  };
}
