// Built-in Intl: no currency library needed. Whole birr, e.g. "ETB 450".
const etb = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 0,
});

export function formatETB(amount) {
  return etb.format(amount);
}
