import type { LatLng } from "./types";

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Great-circle distance between two points (haversine formula). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Initial compass bearing from `from` to `to`, in degrees [0, 360). */
export function bearing(from: LatLng, to: LatLng): number {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Move `km` kilometres from `from` towards `to`.
 * Linear interpolation is accurate enough at city scale.
 */
export function moveTowards(
  from: LatLng,
  to: LatLng,
  km: number,
): { position: LatLng; arrived: boolean } {
  const total = distanceKm(from, to);
  if (km <= 0) return { position: from, arrived: total === 0 };
  if (total <= km) return { position: { ...to }, arrived: true };
  const t = km / total;
  return {
    position: {
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t,
    },
    arrived: false,
  };
}
