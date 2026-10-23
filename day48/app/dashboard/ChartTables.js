import { formatETB } from "@/lib/format";

// Screen readers cannot read an SVG. The honest fix is the same numbers as a table.
export function RevenueTable({ data }) {
  return (
    <table className="mt-4 w-full text-sm">
      <caption className="mb-1 text-left text-gray-600">Revenue by neighbourhood, in ETB</caption>
      <thead>
        <tr>
          <th scope="col" className="py-1 text-left">Area</th>
          <th scope="col" className="py-1 text-right">Revenue</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r) => (
          <tr key={r.area} className="border-t">
            <th scope="row" className="py-1 text-left font-normal">{r.area}</th>
            <td className="py-1 text-right tabular-nums">{formatETB(r.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PerDayTable({ data }) {
  return (
    <details className="mt-4">
      <summary className="min-h-11 cursor-pointer py-2">Show the daily numbers as a table</summary>
      <table className="w-full text-sm">
        <caption className="mb-1 text-left text-gray-600">Orders per day (Addis Ababa time)</caption>
        <thead>
          <tr>
            <th scope="col" className="py-1 text-left">Day</th>
            <th scope="col" className="py-1 text-right">Orders</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.label} className="border-t">
              <th scope="row" className="py-1 text-left font-normal">{r.label}</th>
              <td className="py-1 text-right tabular-nums">{r.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
