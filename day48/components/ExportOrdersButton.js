"use client";

import { toCsv } from "@/lib/csv.mjs";
import { when } from "@/lib/format";

export default function ExportOrdersButton({ orders }) {
  function download() {
    const rows = [
      ["Order", "Placed (EAT)", "Status", "Items", "Total (ETB)"],
      ...orders.map((o) => [
        o.id,
        when.format(new Date(o.createdAt)),
        o.status,
        o.items.map((i) => `${i.qty} × ${i.name}`).join("; "),
        o.total,
      ]),
    ];
    // BOM so Excel reads UTF-8 (Amharic names) correctly.
    const blob = new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "addis-eats-orders.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000); // release the memory after the download starts
  }

  return <button type="button" onClick={download}>Export CSV</button>;
}
