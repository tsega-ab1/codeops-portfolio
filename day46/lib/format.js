const etb = new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 0 });
export function formatETB(amount) { return etb.format(amount); }

// Always name BOTH locale and time zone, or server and phone disagree (hydration mismatch).
export const when = new Intl.DateTimeFormat("en-ET", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Addis_Ababa",
});
