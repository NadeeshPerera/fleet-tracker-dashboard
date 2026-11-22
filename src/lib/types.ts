export interface LatLng {
  lat: number;
  lng: number;
}

export interface Site {
  name: string;
  position: LatLng;
}

export type TruckStatus = "idle" | "to_pickup" | "loading" | "in_transit";

export interface Truck {
  id: string;
  plate: string;
  driver: string;
  capacityTonnes: number;
  position: LatLng;
  /** Compass bearing in degrees, 0 = north. */
  heading: number;
  speedKmh: number;
  status: TruckStatus;
  jobId: string | null;
  updatedAt: number;
}

export type JobStatus =
  | "pending"
  | "allocated"
  | "loading"
  | "in_transit"
  | "delivered";

export interface Job {
  id: string;
  customer: string;
  material: string;
  tonnes: number;
  /** Price per tonne in SGD, excluding GST. */
  pricePerTonne: number;
  pickup: Site;
  dropoff: Site;
  status: JobStatus;
  truckId: string | null;
  createdAt: number;
  updatedAt: number;
  deliveredAt: number | null;
  /** Estimated minutes (simulated time) until delivery. */
  etaMinutes: number | null;
}

export type JobFilter = "all" | "pending" | "active" | "delivered";
