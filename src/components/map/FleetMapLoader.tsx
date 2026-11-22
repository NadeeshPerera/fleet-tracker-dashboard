"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` on import, so the map is client-only and code-split
// into its own chunk. The rest of the dashboard renders while it loads.
const FleetMap = dynamic(() => import("./FleetMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full animate-pulse items-center justify-center bg-slate-100 text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export function FleetMapLoader() {
  return (
    <section aria-label="Live fleet map" className="h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:h-[520px]">
      <FleetMap />
    </section>
  );
}
