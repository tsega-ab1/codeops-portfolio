import Link from "next/link";
import { SORT_COLUMNS, listHref } from "@/lib/dashboard-data";
import { formatETB, when } from "@/lib/format";

// Server component: real table markup, no state, no handlers, zero client JavaScript.
function SortHeader({ column, list, demo, align }) {
  const active = list.sort === column;
  const nextDir = active ? (list.dir === "asc" ? "desc" : "asc") : SORT_COLUMNS[column].defaultDir;
  return (
    <th
      scope="col"
      aria-sort={active ? (list.dir === "asc" ? "ascending" : "descending") : undefined}
      className={`p-0 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <Link
        href={listHref({ sort: column, dir: nextDir, page: 1, demo })}
        className="inline-flex min-h-11 items-center gap-1 px-3 underline-offset-2 hover:underline"
      >
        {SORT_COLUMNS[column].label}
        <span aria-hidden="true">{active ? (list.dir === "asc" ? "↑" : "↓") : ""}</span>
      </Link>
    </th>
  );
}

export default function OrderTable({ list, demo }) {
  return (
    // Horizontal scroll inside a labelled, focusable region on narrow screens.
    <div role="region" aria-label="Orders table" tabIndex={0} className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="p-3 text-left text-gray-600">
          All orders, June 2026 — sorted by {SORT_COLUMNS[list.sort].label.toLowerCase()} (
          {list.dir === "asc" ? "ascending" : "descending"}). Showing {list.rows.length} of {list.total}.
        </caption>
        <thead className="border-b bg-gray-50">
          <tr>
            <SortHeader column="id" list={list} demo={demo} />
            <SortHeader column="area" list={list} demo={demo} />
            <SortHeader column="item" list={list} demo={demo} />
            <SortHeader column="status" list={list} demo={demo} />
            <SortHeader column="date" list={list} demo={demo} />
            <SortHeader column="total" list={list} demo={demo} align="right" />
          </tr>
        </thead>
        <tbody>
          {list.rows.map((o) => (
            <tr key={o.id} className="border-b last:border-0">
              <th scope="row" className="px-3 py-2 text-left font-medium">#{o.id}</th>
              <td className="px-3 py-2">{o.area}</td>
              <td className="px-3 py-2">{o.item}</td>
              <td className="px-3 py-2">{o.status}</td>
              <td className="px-3 py-2 whitespace-nowrap">{when.format(new Date(o.placedAt))}</td>
              {/* numbers right-aligned, tabular figures so digits line up */}
              <td className="px-3 py-2 text-right tabular-nums">{formatETB(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
