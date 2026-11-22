import type { Job, Truck } from "@/lib/types";

export const makeTruck = (overrides: Partial<Truck> = {}): Truck => ({
  id: "T1",
  plate: "YN 4821 K",
  driver: "Ahmad Rahman",
  capacityTonnes: 32,
  position: { lat: 1.3205, lng: 103.6405 },
  heading: 0,
  speedKmh: 0,
  status: "idle",
  jobId: null,
  updatedAt: 0,
  ...overrides,
});

export const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: "JOB-1001",
  customer: "Lion City Builders",
  material: "Washed Sand",
  tonnes: 20,
  pricePerTonne: 38,
  pickup: { name: "Tuas Aggregates Yard", position: { lat: 1.3205, lng: 103.6405 } },
  dropoff: { name: "Tengah New Town", position: { lat: 1.355, lng: 103.73 } },
  status: "pending",
  truckId: null,
  createdAt: 0,
  updatedAt: 0,
  deliveredAt: null,
  etaMinutes: null,
  ...overrides,
});
