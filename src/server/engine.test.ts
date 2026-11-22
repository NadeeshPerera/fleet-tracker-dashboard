import { describe, expect, it } from "vitest";
import { makeJob, makeTruck } from "@/test/fixtures";
import {
  AUTO_DISPATCH_DELAY_MS,
  LOADING_MS,
  allocateJob,
  createInitialState,
  createRng,
  findNearestIdleTruck,
  tick,
  type EngineState,
} from "./engine";

function stateWith(trucks = [makeTruck()], jobs = [makeJob()]): EngineState {
  return {
    trucks: Object.fromEntries(trucks.map((t) => [t.id, t])),
    jobs: Object.fromEntries(jobs.map((j) => [j.id, j])),
    jobSeq: jobs.length,
    lastJobSpawnAt: 0,
    loadingUntil: {},
    autoDispatch: false,
  };
}

describe("createInitialState", () => {
  it("is deterministic for a given seed", () => {
    const a = createInitialState(1_000_000, createRng(42));
    const b = createInitialState(1_000_000, createRng(42));
    expect(a).toEqual(b);
  });

  it("starts with 8 trucks and a mix of job statuses", () => {
    const state = createInitialState(1_000_000, createRng(1));
    const statuses = Object.values(state.jobs).map((j) => j.status);
    expect(Object.keys(state.trucks)).toHaveLength(8);
    expect(statuses).toContain("pending");
    expect(statuses).toContain("in_transit");
    expect(statuses).toContain("delivered");
  });
});

describe("allocateJob", () => {
  it("assigns an idle truck to a pending job", () => {
    const state = stateWith();
    const result = allocateJob(state, "JOB-1001", "T1", 100);
    expect(result.ok).toBe(true);
    expect(state.jobs["JOB-1001"]).toMatchObject({ status: "allocated", truckId: "T1" });
    expect(state.trucks.T1).toMatchObject({ status: "to_pickup", jobId: "JOB-1001" });
    expect(state.jobs["JOB-1001"].etaMinutes).toBeGreaterThan(0);
  });

  it("rejects a truck that is already busy", () => {
    const state = stateWith([makeTruck({ status: "in_transit", jobId: "JOB-9" })]);
    expect(allocateJob(state, "JOB-1001", "T1", 100)).toEqual({ ok: false, error: "YN 4821 K is no longer idle" });
  });

  it("rejects a job that is no longer pending (e.g. another dispatcher got there first)", () => {
    const state = stateWith([makeTruck()], [makeJob({ status: "allocated", truckId: "T2" })]);
    const result = allocateJob(state, "JOB-1001", "T1", 100);
    expect(result.ok).toBe(false);
  });

  it("rejects unknown ids", () => {
    expect(allocateJob(stateWith(), "JOB-404", "T1", 0)).toEqual({ ok: false, error: "Job JOB-404 not found" });
  });
});

describe("findNearestIdleTruck", () => {
  it("ignores busy trucks and picks the closest idle one", () => {
    const target = { lat: 1.3, lng: 103.8 };
    const trucks = [
      makeTruck({ id: "near-busy", position: { lat: 1.3, lng: 103.801 }, status: "in_transit" }),
      makeTruck({ id: "far", position: { lat: 1.45, lng: 103.8 } }),
      makeTruck({ id: "near", position: { lat: 1.31, lng: 103.8 } }),
    ];
    expect(findNearestIdleTruck(trucks, target)?.id).toBe("near");
    expect(findNearestIdleTruck([trucks[0]], target)).toBeNull();
  });
});

describe("tick", () => {
  it("drives a job through pickup → loading → in transit → delivered", () => {
    const state = stateWith();
    const rng = createRng(7);
    allocateJob(state, "JOB-1001", "T1", 0);

    // Truck starts at the pickup, so the first tick arrives and starts loading.
    let now = 1000;
    tick(state, now, 1000, rng);
    expect(state.trucks.T1.status).toBe("loading");
    expect(state.jobs["JOB-1001"].status).toBe("loading");

    now += LOADING_MS;
    tick(state, now, LOADING_MS, rng);
    expect(state.jobs["JOB-1001"].status).toBe("in_transit");

    for (let i = 0; i < 120 && state.jobs["JOB-1001"].status !== "delivered"; i++) {
      now += 1000;
      tick(state, now, 1000, rng);
    }
    expect(state.jobs["JOB-1001"]).toMatchObject({ status: "delivered", etaMinutes: 0, deliveredAt: now });
    expect(state.trucks.T1).toMatchObject({ status: "idle", jobId: null, speedKmh: 0 });
    expect(state.trucks.T1.position).toEqual(state.jobs["JOB-1001"].dropoff.position);
  });

  it("only reports entities that changed", () => {
    const state = stateWith([makeTruck(), makeTruck({ id: "T2" })], [makeJob()]);
    const changes = tick(state, 1000, 1000, createRng(1));
    expect(changes).toEqual({ trucks: [], jobs: [] });
  });

  it("auto-dispatches stale pending jobs to the nearest idle truck", () => {
    const pickup = makeJob().pickup.position;
    const state = stateWith(
      [
        makeTruck({ id: "far", position: { lat: 1.44, lng: 103.79 } }),
        makeTruck({ id: "near", position: { lat: pickup.lat + 0.01, lng: pickup.lng } }),
      ],
      [makeJob({ createdAt: 0 })],
    );
    state.autoDispatch = true;

    tick(state, AUTO_DISPATCH_DELAY_MS - 1, 1000, createRng(1));
    expect(state.jobs["JOB-1001"].status).toBe("pending");

    const changes = tick(state, AUTO_DISPATCH_DELAY_MS, 1000, createRng(1));
    expect(state.jobs["JOB-1001"]).toMatchObject({ status: "allocated", truckId: "near" });
    expect(changes.trucks.map((t) => t.id)).toEqual(["near"]);
  });
});
