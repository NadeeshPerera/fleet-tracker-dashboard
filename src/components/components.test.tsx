import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";
import { FleetHubContext } from "@/realtime/RealtimeProvider";
import type { FleetHub } from "@/realtime/mockFleetHub";
import { makeStore } from "@/store";
import { snapshotReceived } from "@/store/slices";
import { makeJob, makeTruck } from "@/test/fixtures";
import { JobsTable } from "./jobs/JobsTable";
import { TruckList } from "./TruckList";

function setup(ui: ReactNode) {
  const store = makeStore();
  store.dispatch(
    snapshotReceived({
      serverTime: 0,
      trucks: [
        makeTruck({ id: "T1", plate: "YN 4821 K", driver: "Ahmad Rahman" }),
        makeTruck({ id: "T2", plate: "XD 3307 B", driver: "Tan Wei Ming", position: { lat: 1.45, lng: 103.8 } }),
        makeTruck({ id: "T3", plate: "YP 1196 H", driver: "Ravi Kumar", status: "in_transit", jobId: "JOB-2", speedKmh: 52 }),
      ],
      jobs: [
        makeJob({ id: "JOB-1" }),
        makeJob({ id: "JOB-2", status: "in_transit", truckId: "T3", etaMinutes: 14 }),
        makeJob({ id: "JOB-3", status: "delivered", truckId: "T1", deliveredAt: 1 }),
      ],
    }),
  );
  const hub = {
    allocateJob: vi.fn().mockResolvedValue({ ok: true }),
  } as unknown as FleetHub;

  render(
    <Provider store={store}>
      <FleetHubContext.Provider value={hub}>{ui}</FleetHubContext.Provider>
    </Provider>,
  );
  return { store, hub, user: userEvent.setup() };
}

describe("<TruckList />", () => {
  it("lists trucks in a stable plate order with their current job", () => {
    setup(<TruckList />);
    const items = screen.getAllByRole("listitem");
    expect(items.map((i) => i.querySelector(".font-mono")?.textContent)).toEqual(["XD 3307 B", "YN 4821 K", "YP 1196 H"]);
    expect(items[2]).toHaveTextContent("JOB-2 → Tengah New Town");
    expect(items[2]).toHaveTextContent("52 km/h");
  });

  it("filters by driver name and selects a truck", async () => {
    const { store, user } = setup(<TruckList />);
    await user.type(screen.getByRole("searchbox", { name: "Search trucks" }), "tan wei");

    const button = screen.getByRole("button", { name: /XD 3307 B/ });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    await user.click(button);
    expect(store.getState().ui.selectedTruckId).toBe("T2");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
});

describe("<JobsTable />", () => {
  it("filters by status", async () => {
    const { user } = setup(<JobsTable />);
    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3

    await user.click(screen.getByRole("button", { name: /Delivered/ }));
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(2);
    expect(within(rows[1]).getByRole("button", { name: "Download invoice for JOB-3" })).toBeInTheDocument();
  });

  it("allocates a pending job to the nearest idle truck via the hub", async () => {
    const { hub, user } = setup(<JobsTable />);
    const select = screen.getByRole("combobox", { name: "Allocate a truck to JOB-1" });

    // Idle trucks are listed nearest-first; the busy truck is excluded.
    const options = within(select).getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Allocate truck…", "YN 4821 K · 0.0 km", expect.stringMatching(/^XD 3307 B · \d+\.\d km$/)]);

    await user.selectOptions(select, "T1");
    expect(hub.allocateJob).toHaveBeenCalledWith("JOB-1", "T1");
  });
});
