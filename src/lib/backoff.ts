/**
 * Exponential backoff for reconnect attempts: base, 2×base, 4×base… capped at max.
 * Pass a `random` source to add "full jitter" so many clients don't reconnect in lockstep.
 */
export function getBackoffDelay(
  attempt: number,
  { baseMs = 1000, maxMs = 10_000, random }: { baseMs?: number; maxMs?: number; random?: () => number } = {},
): number {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt));
  return random ? Math.round(exp * random()) : exp;
}
