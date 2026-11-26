import colors from "tailwindcss/colors";
import { describe, expect, it } from "vitest";
import { JOB_STATUS, TRUCK_STATUS } from "./status";

type Palette = Record<string, Record<string, string>>;

/** Resolves a Tailwind class such as "text-amber-800" (optionally "dark:"-prefixed) to its hex colour. */
function colourOf(badge: string, kind: "bg" | "text", dark: boolean): string {
  const prefix = `${dark ? "dark:" : ""}${kind}-`;
  const cls = badge.split(" ").find((c) => c.startsWith(prefix) && !c.slice(prefix.length).includes(":"));
  if (!cls) throw new Error(`no ${prefix} class in "${badge}"`);
  const [name, shade] = cls.slice(prefix.length).split("-");
  return (colors as unknown as Palette)[name][shade];
}

/** WCAG 2.x relative luminance and contrast ratio. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const badges = [
  ...Object.entries(TRUCK_STATUS).map(([k, v]) => [`truck ${k}`, v.badge] as const),
  ...Object.entries(JOB_STATUS).map(([k, v]) => [`job ${k}`, v.badge] as const),
];

describe("status badge contrast (WCAG AA, 4.5:1 for small text)", () => {
  it("computes contrast correctly", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it.each(badges)("%s meets AA in light and dark themes", (_, badge) => {
    for (const dark of [false, true]) {
      const ratio = contrast(colourOf(badge, "text", dark), colourOf(badge, "bg", dark));
      expect(ratio, `${dark ? "dark" : "light"}: ${badge}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
