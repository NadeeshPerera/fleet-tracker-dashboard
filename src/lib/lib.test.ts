import { describe, expect, it } from "vitest";
import { getBackoffDelay } from "./backoff";
import { formatEta } from "./format";
import { bearing, distanceKm, moveTowards } from "./geo";
import { calculateInvoice } from "./invoiceMath";

const tuas = { lat: 1.3205, lng: 103.6405 };
const marina = { lat: 1.272, lng: 103.863 };

describe("geo", () => {
  it("measures distance across Singapore with the haversine formula", () => {
    expect(distanceKm(tuas, marina)).toBeCloseTo(25.3, 0);
    expect(distanceKm(tuas, tuas)).toBe(0);
  });

  it("computes compass bearings", () => {
    const origin = { lat: 1.3, lng: 103.8 };
    expect(bearing(origin, { lat: 1.4, lng: 103.8 })).toBeCloseTo(0, 1);
    expect(bearing(origin, { lat: 1.3, lng: 103.9 })).toBeCloseTo(90, 0);
    expect(bearing(origin, { lat: 1.2, lng: 103.8 })).toBeCloseTo(180, 1);
  });

  it("moves part of the way, then snaps to the target on arrival", () => {
    const half = distanceKm(tuas, marina) / 2;
    const step = moveTowards(tuas, marina, half);
    expect(step.arrived).toBe(false);
    expect(distanceKm(step.position, marina)).toBeCloseTo(half, 1);

    const final = moveTowards(step.position, marina, half + 1);
    expect(final).toEqual({ position: marina, arrived: true });
  });
});

describe("getBackoffDelay", () => {
  it("doubles each attempt and caps at the maximum", () => {
    expect([0, 1, 2, 3, 4, 5].map((a) => getBackoffDelay(a))).toEqual([1000, 2000, 4000, 8000, 10000, 10000]);
  });

  it("applies full jitter when given a random source", () => {
    expect(getBackoffDelay(2, { random: () => 0.5 })).toBe(2000);
  });
});

describe("calculateInvoice", () => {
  it("adds 9% Singapore GST and rounds to cents", () => {
    expect(calculateInvoice({ tonnes: 20, pricePerTonne: 38 })).toEqual({ subtotal: 760, gst: 68.4, total: 828.4 });
  });

  it("avoids floating-point drift", () => {
    // 0.1 * 3 * 100 is 30.000000000000004 in IEEE floats
    expect(calculateInvoice({ tonnes: 3, pricePerTonne: 0.1 })).toEqual({ subtotal: 0.3, gst: 0.03, total: 0.33 });
  });
});

describe("formatEta", () => {
  it.each([
    [null, "—"],
    [0, "0 min"],
    [42.4, "42 min"],
    [60, "1 h"],
    [95, "1 h 35 min"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatEta(input)).toBe(expected);
  });
});
