const sgd = new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" });
const time = new Intl.DateTimeFormat("en-SG", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export const formatSGD = (amount: number) => sgd.format(amount);

export const formatTime = (timestamp: number) => time.format(timestamp);

export function formatEta(minutes: number | null): string {
  if (minutes === null) return "—";
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}
