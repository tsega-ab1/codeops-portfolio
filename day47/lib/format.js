// Build each formatter once. Always name BOTH locale and time zone,
// or server and phone disagree (hydration mismatch).
export const etb = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 0,
});
export const formatETB = (amount) => etb.format(amount);

export const when = new Intl.DateTimeFormat("en-ET", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Addis_Ababa",
});

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS = [["day", 86400], ["hour", 3600], ["minute", 60]];

// relative("2026-10-22T10:00:00Z") -> "3 hours ago"
export function relative(iso, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "second");
}
