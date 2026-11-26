/** Controllable `prefers-color-scheme` for tests (jsdom has no matchMedia). */
export function mockSystemTheme(initiallyDark: boolean) {
  let dark = initiallyDark;
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const query = {
    get matches() {
      return dark;
    },
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.add(l),
    removeEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.delete(l),
  };
  window.matchMedia = (() => query) as unknown as typeof window.matchMedia;
  return {
    setDark(next: boolean) {
      dark = next;
      listeners.forEach((l) => l({ matches: next } as MediaQueryListEvent));
    },
    listenerCount: () => listeners.size,
  };
}

export function resetTheme() {
  localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.style.colorScheme = "";
}
