"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatETB } from "@/lib/format";

// Client leaf: charts measure the DOM. The wrapper has a REAL height, so nothing
// collapses and the page does not jump when the chart appears.
export default function RevenueChart({ data }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="area" />
          {/* Bars must start at zero: the bar's length IS the value. */}
          <YAxis width={90} domain={[0, "auto"]} tickFormatter={formatETB} />
          <Tooltip formatter={(v) => [formatETB(v), "Revenue"]} />
          <Bar dataKey="revenue" fill="#1B4D8E" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
