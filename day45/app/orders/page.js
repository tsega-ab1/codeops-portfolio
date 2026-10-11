import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getOrdersFor } from "@/lib/db";

export const metadata = { title: "My orders", robots: { index: false, follow: false } };

export default async function OrdersPage() {
  const user = await getSession();
  if (!user) redirect("/signin?next=/orders");

  // Scoped to the session id, never to an id sent by the browser.
  const orders = getOrdersFor(user.id);

  return (
    <section>
      <h1>My orders</h1>
      {orders.length === 0 ? (
        <p>No orders yet. <Link href="/menu">Browse the menu</Link>.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Order</th><th>Status</th><th>Total</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><Link href={`/orders/${order.id}`}>{order.id}</Link></td>
                <td style={{ textTransform: "capitalize" }}>{order.status}</td>
                <td>{order.total} ETB</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
