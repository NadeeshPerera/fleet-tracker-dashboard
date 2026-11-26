import { afterEach, describe, expect, it, vi } from "vitest";
import { mockSystemTheme, resetTheme } from "@/test/matchMedia";
import {
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  getTheme,
  readSavedTheme,
  resolveTheme,
  setTheme,
  subscribeTheme,
} from "./theme";

const runInitScript = () => new Function(THEME_INIT_SCRIPT)();
const root = document.documentElement;

afterEach(resetTheme);

describe("resolveTheme", () => {
  it("follows the OS when nothing is saved", () => {
    mockSystemTheme(true);
    expect(resolveTheme()).toBe("dark");
    mockSystemTheme(false);
    expect(resolveTheme()).toBe("light");
  });

  it("prefers the saved choice and ignores junk values", () => {
    mockSystemTheme(true);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(resolveTheme()).toBe("light");
    localStorage.setItem(THEME_STORAGE_KEY, "purple");
    expect(readSavedTheme()).toBeNull();
    expect(resolveTheme()).toBe("dark");
  });
});

describe("THEME_INIT_SCRIPT (runs before paint)", () => {
  it.each([
    { saved: null, systemDark: true, expected: "dark" },
    { saved: null, systemDark: false, expected: "light" },
    { saved: "light", systemDark: true, expected: "light" },
    { saved: "dark", systemDark: false, expected: "dark" },
  ])("saved=$saved, OS dark=$systemDark → $expected (same as resolveTheme)", ({ saved, systemDark, expected }) => {
    mockSystemTheme(systemDark);
    if (saved) localStorage.setItem(THEME_STORAGE_KEY, saved);
    runInitScript();
    expect(getTheme()).toBe(expected);
    expect(root.style.colorScheme).toBe(expected);
    expect(resolveTheme()).toBe(expected);
  });

  it("never throws, even when storage is blocked", () => {
    mockSystemTheme(false);
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(runInitScript).not.toThrow();
    spy.mockRestore();
  });
});

describe("setTheme / subscribeTheme", () => {
  it("saves the choice, applies it and notifies subscribers", () => {
    mockSystemTheme(false);
    const listener = vi.fn();
    const unsubscribe = subscribeTheme(listener);

    setTheme("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(root).toHaveClass("dark");
    expect(listener).toHaveBeenCalledTimes(1);

    setTheme("light");
    expect(root).not.toHaveClass("dark");
    unsubscribe();
  });

  it("tracks OS changes live until the user picks a theme", () => {
    const system = mockSystemTheme(false);
    const listener = vi.fn();
    const unsubscribe = subscribeTheme(listener);

    system.setDark(true);
    expect(getTheme()).toBe("dark");
    expect(listener).toHaveBeenCalledTimes(1);

    setTheme("light"); // explicit choice
    system.setDark(true);
    expect(getTheme()).toBe("light");

    unsubscribe();
    expect(system.listenerCount()).toBe(0); // no leaked media listener
  });
});
