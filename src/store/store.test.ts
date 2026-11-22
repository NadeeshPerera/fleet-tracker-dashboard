import { describe, expect, it } from "vitest";
import { makeJob, makeTruck } from "@/test/fixtures";
import { makeStore } from "./index";
import { selectJobCounts, selectKpis, selectVisibleJobs } from "./selectors";
import { deltaReceived, jobFilterChanged, reconnectScheduled, searchChanged, snapshotReceived, truckSelected } from "./slices";

const seed = () => {
  const store = makeStore();
  store.dispatch(
    snapshotReceived({
      serverTime: 1000,
      trucks: [makeTruck({ id: "T1" }), makeTruck({ id: "T2", plate: "XD 3307 B", status: "in_transit", jobId: "JOB-2" })],
      jobs: [
        makeJob({ id: "JOB-1", createdAt: 1 }),
        makeJob({ id: "JOB-2", status: "in_transit", truckId: "T2", customer: "Kallang Precast", createdAt: 2 }),
        makeJob({ id: "JOB-3", status: "delivered", tonnes: 10, pricePerTonne: 20, deliveredAt: 50 }),
        makeJob({ id: "JOB-4", status: "delivered", tonnes: 5, pricePerTonne: 10, deliveredAt: 90 }),
      ],
    }),
  );
  return store;
};

describe("realtime reducers", () => {
  it("snapshot replaces all entities; delta upserts", () => {
    const store = seed();
    store.dispatch(
      deltaReceived({ serverTime: 2000, trucks: [], jobs: [makeJob({ id: "JOB-1", status: "allocated", truckId: "T1" })] }),
    );
    expect(store.getState().jobs.entities["JOB-1"].status).toBe("allocated");
    expect(store.getState().jobs.ids).toHaveLength(4);
    expect(store.getState().connection.lastMessageAt).toBe(2000);

    store.dispatch(snapshotReceived({ serverTime: 3000, trucks: [], jobs: [] }));
    expect(store.getState().jobs.ids).toHaveLength(0);
  });

  it("tracks reconnect attempts", () => {
    const store = makeStore();
    store.dispatch(reconnectScheduled({ attempt: 2, retryInMs: 2000 }));
    expect(store.getState().connection).toMatchObject({ status: "reconnecting", attempt: 2, retryInMs: 2000 });
  });

  it("toggles truck selection", () => {
    const store = makeStore();
    store.dispatch(truckSelected("T1"));
    expect(store.getState().ui.selectedTruckId).toBe("T1");
    store.dispatch(truckSelected("T1"));
    expect(store.getState().ui.selectedTruckId).toBeNull();
  });
});

describe("selectors", () => {
  it("computes KPIs", () => {
    expect(selectKpis(seed().getState())).toEqual({
      totalTrucks: 2,
      busyTrucks: 1,
      utilisation: 0.5,
      pendingJobs: 1,
      activeJobs: 1,
      deliveredJobs: 2,
      deliveredTonnes: 15,
      revenue: 250,
    });
  });

  it("counts jobs per filter", () => {
    expect(selectJobCounts(seed().getState())).toEqual({ all: 4, pending: 1, active: 1, delivered: 2 });
  });

  it("orders pending → active → delivered (newest delivery first)", () => {
    expect(selectVisibleJobs(seed().getState()).map((j) => j.id)).toEqual(["JOB-1", "JOB-2", "JOB-4", "JOB-3"]);
  });

  it("filters by status and searches customer or truck plate", () => {
    const store = seed();
    store.dispatch(jobFilterChanged("delivered"));
    expect(selectVisibleJobs(store.getState()).map((j) => j.id)).toEqual(["JOB-4", "JOB-3"]);

    store.dispatch(jobFilterChanged("all"));
    store.dispatch(searchChanged("xd 3307"));
    expect(selectVisibleJobs(store.getState()).map((j) => j.id)).toEqual(["JOB-2"]);

    store.dispatch(searchChanged("kallang"));
    expect(selectVisibleJobs(store.getState()).map((j) => j.id)).toEqual(["JOB-2"]);
  });

  it("memoises: same input state returns the same array reference", () => {
    const state = seed().getState();
    expect(selectVisibleJobs(state)).toBe(selectVisibleJobs(state));
  });
});
