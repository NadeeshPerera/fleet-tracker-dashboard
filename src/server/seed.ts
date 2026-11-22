import type { Site } from "@/lib/types";

// All companies, people and plates below are fictional demo data.

export const DEPOTS: Site[] = [
  { name: "Tuas Aggregates Yard", position: { lat: 1.3205, lng: 103.6405 } },
  { name: "Jurong Port Depot", position: { lat: 1.3085, lng: 103.7205 } },
  { name: "Senoko Batching Plant", position: { lat: 1.4655, lng: 103.8015 } },
  { name: "Pasir Panjang Yard", position: { lat: 1.2745, lng: 103.7655 } },
];

export const SITES: Site[] = [
  { name: "Tengah New Town", position: { lat: 1.355, lng: 103.73 } },
  { name: "Punggol Digital District", position: { lat: 1.408, lng: 103.907 } },
  { name: "Changi East", position: { lat: 1.36, lng: 103.995 } },
  { name: "Marina South", position: { lat: 1.272, lng: 103.863 } },
  { name: "Bidadari Estate", position: { lat: 1.337, lng: 103.871 } },
  { name: "Jurong Lake District", position: { lat: 1.334, lng: 103.74 } },
  { name: "Tampines North", position: { lat: 1.365, lng: 103.93 } },
  { name: "Woodlands North Coast", position: { lat: 1.447, lng: 103.787 } },
];

export const CUSTOMERS = [
  "Lion City Builders",
  "Straits Construction",
  "Merlion Civil Works",
  "Harbourfront Developments",
  "Orchid Infrastructure",
  "Kallang Precast",
];

/** Material → price per tonne in SGD (excl. GST). */
export const MATERIALS: Record<string, number> = {
  "20mm Aggregate": 32,
  "Crusher Run": 24,
  "Washed Sand": 38,
  "Road Base": 21,
  "Quarry Dust": 18,
  "Ready-Mix Concrete": 45,
};

export const TRUCKS = [
  { plate: "YN 4821 K", driver: "Ahmad Rahman" },
  { plate: "XD 3307 B", driver: "Tan Wei Ming" },
  { plate: "YP 1196 H", driver: "Ravi Kumar" },
  { plate: "XE 7754 C", driver: "Lim Jia Hui" },
  { plate: "YM 2049 T", driver: "Muthu Sami" },
  { plate: "XB 6612 P", driver: "Chen Jun Jie" },
  { plate: "YK 9083 D", driver: "Nur Aisyah" },
  { plate: "XF 5530 L", driver: "Daniel Ong" },
];
