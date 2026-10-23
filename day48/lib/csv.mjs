// The escaping is the whole problem: quote anything with a comma, quote or newline.
export function cell(value) {
  const s = String(value ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function toCsv(rows) {
  return rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
