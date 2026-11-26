/**
 * Light/dark theme as a tiny external store (for useSyncExternalStore).
 *
 * - With no saved choice, the theme follows the OS (`prefers-color-scheme`) and
 *   updates live when the OS setting changes.
 * - Once the user picks a theme with the header toggle, it is saved in
 *   localStorage and wins over the OS setting.
 * - The `dark` class on <html> drives Tailwind's `dark:` variants. THEME_INIT_SCRIPT
 *   sets it before first paint so there is no light flash on load.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "fleet-tracker.theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export function readSavedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null; // storage blocked (e.g. privacy mode)
  }
}

const systemTheme = (): Theme => (window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light");

export const resolveTheme = (): Theme => readSavedTheme() ?? systemTheme();

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  // Native controls (scrollbars, date pickers, selects) follow the theme too.
  root.style.colorScheme = theme;
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function onSystemChange() {
  if (readSavedTheme()) return; // an explicit choice wins over the OS
  applyTheme(systemTheme());
  notify();
}

export function subscribeTheme(listener: () => void): () => void {
  if (listeners.size === 0) window.matchMedia?.(DARK_QUERY).addEventListener("change", onSystemChange);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.matchMedia?.(DARK_QUERY).removeEventListener("change", onSystemChange);
  };
}

/** Current theme as shown on screen. */
export const getTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

/** The server can't know the user's theme; the init script fixes the DOM before paint. */
export const getServerTheme = (): Theme => "light";

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Non-fatal: the choice just won't survive a reload.
  }
  applyTheme(theme);
  notify();
}

/**
 * Inline <head> script, run before the page paints. It must be self-contained
 * (it can't import this module), so it repeats resolveTheme + applyTheme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=="light"&&t!=="dark")t=window.matchMedia&&window.matchMedia(${JSON.stringify(DARK_QUERY)}).matches?"dark":"light";var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.style.colorScheme=t}catch(e){}})();`;
