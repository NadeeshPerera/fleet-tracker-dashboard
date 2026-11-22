import { useEffect, useRef, useState } from "react";

/** Returns true for `durationMs` after `value` changes — used to highlight updated rows. */
export function useFlashOnChange(value: unknown, durationMs = 1200): boolean {
  const previous = useRef(value);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    previous.current = value;
    setFlashing(true);
    const timer = setTimeout(() => setFlashing(false), durationMs);
    return () => clearTimeout(timer);
  }, [value, durationMs]);

  return flashing;
}
