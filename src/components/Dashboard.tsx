"use client";

import { RealtimeProvider } from "@/realtime/RealtimeProvider";
import { Header } from "./Header";
import { JobsTable } from "./jobs/JobsTable";
import { KpiCards } from "./KpiCards";
import { FleetMapLoader } from "./map/FleetMapLoader";
import { StoreProvider } from "./StoreProvider";
import { Toaster } from "./Toaster";
import { TruckList } from "./TruckList";

export function Dashboard() {
  return (
    <StoreProvider>
      <RealtimeProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <Header />
          <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6">
            <KpiCards />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <FleetMapLoader />
              <TruckList />
            </div>
            <JobsTable />
          </main>
          <Toaster />
        </div>
      </RealtimeProvider>
    </StoreProvider>
  );
}
