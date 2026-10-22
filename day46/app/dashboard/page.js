import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  getAllDashboardOrders, revenueByArea, ordersPerDay, parseListParams, sortAndPage, RANGE_LABEL,
} from "@/lib/dashboard-data";
import RevenueChart from "./RevenueChart";
import OrdersChart from "./OrdersChart";
import { RevenueTable, PerDayTable } from "./ChartTables";
import OrderTable from "./OrderTable";
import Pager from "./Pager";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardPage({ searchParams }) {
  // Layer 2 again: verified session AND staff role (this is business-wide data).
  const session = await getSession();
  if (!session) redirect("/signin?next=/dashboard");
  if (session.role !== "staff") {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p>The dashboard is available only to staff.</p>
      </main>
    );
  }

  const sp = await searchParams;

  // Demo switches so every state can be shown on demand: ?demo=slow | empty | error
  const demo = typeof sp.demo === "string" ? sp.demo : "";
  if (demo === "slow") await new Promise((r) => setTimeout(r, 2000)); // shows loading.js
  if (demo === "error") throw new Error("Demo error: the dashboard could not load its data.");

  const orders = demo === "empty" ? [] : getAllDashboardOrders();

  // Empty state: say WHY it is empty and what to do next.
  if (orders.length === 0) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="mb-4 text-3xl font-bold">Dashboard</h1>
        <div className="rounded-lg border bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">No orders yet</h2>
          <p className="mt-2 text-gray-600">
            Charts and the order table appear as soon as customers place their first order.
          </p>
          <Link href="/menu" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#1B4D8E] px-4 text-white">
            Browse the menu
          </Link>
        </div>
      </main>
    );
  }

  // Aggregate on the server: 6 + 30 summary rows cross to the browser, not 140 orders.
  const revenue = revenueByArea(orders);
  const perDay = ordersPerDay(orders);
  const list = sortAndPage(orders, parseListParams(sp));

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <section aria-labelledby="revenue-heading">
        <h2 id="revenue-heading" className="mb-3 text-xl font-semibold">
          Revenue by neighbourhood (ETB, {RANGE_LABEL})
        </h2>
        <RevenueChart data={revenue} />
        <RevenueTable data={revenue} />
      </section>

      <section aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="mb-3 text-xl font-semibold">
          Orders per day (count, {RANGE_LABEL}, Addis Ababa time)
        </h2>
        <OrdersChart data={perDay} />
        <PerDayTable data={perDay} />
      </section>

      <section aria-labelledby="table-heading">
        <h2 id="table-heading" className="mb-3 text-xl font-semibold">Orders</h2>
        <OrderTable list={list} demo={demo} />
        <Pager list={list} demo={demo} />
      </section>
    </main>
  );
}
