# Roadmap

Planned features, in order. Each item is sized to be one pull request, with tests, that keeps CI green.
When an item ships, tick it and link the PR.

Rules for every item:
- Keep the simulation engine (`src/server/engine.ts`) pure and deterministic: inject `now` and the RNG, never call `Date.now()` or `Math.random()` inside it.
- UI changes must stay accessible: labelled controls, keyboard support, `aria-live` for live updates.
- Add or update Vitest/RTL tests for everything you change.

## Backlog

- [ ] **1. Dark mode.** System preference plus a header toggle, saved in `localStorage`. Use a dark map tile style, and keep status colours at WCAG AA contrast.
- [ ] **2. Truck detail drawer.** Clicking a truck opens a side panel with driver, capacity, current job, the last 10 position updates (a sparkline of speed), and a "Follow on map" toggle.
- [ ] **3. Jobs table sorting.** Sortable columns (job, customer, status, ETA, total) with `aria-sort`, and the sort state kept in the URL.
- [ ] **4. Create job form.** Dispatchers can create a job (customer, material, tonnes, pickup, dropoff) with validation. The engine accepts it through a new hub method `createJob`.
- [ ] **5. Delayed-job alerts.** Flag jobs whose ETA has grown by more than 15 simulated minutes since allocation. Show a badge, a toast, and a filter for "Delayed".
- [ ] **6. Daily report CSV.** Export delivered jobs (tonnes, revenue, GST, truck, delivery time) for the current session as CSV.
- [ ] **7. Geofenced site arrival.** Use a 300 m radius around sites to mark "arrived" and show arrival and departure times on the job.
- [ ] **8. Map clustering and fit-to-fleet.** Cluster site markers when zoomed out, and add a "Fit all trucks" control.
- [ ] **9. Playwright end-to-end tests.** Load the app, allocate a pending job, simulate a network drop, and check that it reconnects. Run in CI.
- [ ] **10. Road-following routes.** Pre-computed road polylines (stored as JSON) for depot→site pairs, so trucks follow roads instead of straight lines.
- [ ] **11. Real SignalR backend.** Add an ASP.NET Core 8 SignalR hub that implements the same `FleetHub` contract, switched on with an env var. The mock stays the default for the demo.

## Done

_Nothing yet: the first scheduled PR will land here._
