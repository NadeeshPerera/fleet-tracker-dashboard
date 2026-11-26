"use client";

import { useTheme } from "@/hooks/useTheme";

/** Header switch for dark mode. The choice is saved; until then the OS setting is followed. */
export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
    >
      <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        {dark ? (
          <path d="M7.46 2.2a.75.75 0 0 1 .1.83 6.5 6.5 0 0 0 8.41 9.03.75.75 0 0 1 .96.98A8 8 0 1 1 6.6 2.1a.75.75 0 0 1 .86.1Z" />
        ) : (
          <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2Zm0 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 9a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15Zm8-5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10Zm9.66-5.66a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM7.46 12.54a.75.75 0 0 1 0 1.06L6.4 14.66a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm7.2 2.12a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 0 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06ZM7.46 7.46a.75.75 0 0 1-1.06 0L5.34 6.4A.75.75 0 0 1 6.4 5.34l1.06 1.06a.75.75 0 0 1 0 1.06Z" />
        )}
      </svg>
      Dark mode
    </button>
  );
}
