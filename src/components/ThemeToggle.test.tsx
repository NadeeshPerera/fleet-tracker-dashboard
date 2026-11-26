import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "@/lib/theme";
import { mockSystemTheme, resetTheme } from "@/test/matchMedia";
import { ThemeToggle } from "./ThemeToggle";

afterEach(resetTheme);

describe("<ThemeToggle />", () => {
  it("starts from the OS preference and saves the user's choice", async () => {
    mockSystemTheme(true);
    new Function(THEME_INIT_SCRIPT)();
    render(<ThemeToggle />);

    const toggle = screen.getByRole("switch", { name: "Dark mode" });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await userEvent.setup().click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("works from the keyboard", async () => {
    mockSystemTheme(false);
    render(<ThemeToggle />);
    const user = userEvent.setup();

    await user.tab();
    const toggle = screen.getByRole("switch", { name: "Dark mode" });
    expect(toggle).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("updates when the OS theme changes and nothing is saved", () => {
    const system = mockSystemTheme(false);
    render(<ThemeToggle />);
    act(() => system.setDark(true));
    expect(screen.getByRole("switch", { name: "Dark mode" })).toHaveAttribute("aria-checked", "true");
  });
});
