import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getOrdersFor, DEMO_MENU } from "@/lib/orders";
import SignOutButton from "@/app/_components/SignOutButton";
import CancelButton from "./CancelButton";
import PlaceOrderForm from "./PlaceOrderForm";

async function MyOrders() {
  // Layer 2: the page re-checks the real session (Proxy only saw a cookie).
  const session = await getSession();
  if (!session) redirect("/signin?next=/orders");

  // Scoped query: identity comes from the SESSION, never from the URL.
  const orders = getOrdersFor(session.userId);

  return (
    <>
      <p>
        Signed in as: {session.name} ({session.role})
      </p>
      <SignOutButton />

      <PlaceOrderForm dishes={Object.keys(DEMO_MENU)} />

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <article key={order.id}>
            <h2>{order.item}</h2>
            <p>
              Order <Link href={`/orders/${order.id}`}>#{order.id}</Link> — Status: {order.status}
            </p>
            {order.status === "Preparing" && <CancelButton orderId={order.id} />}
          </article>
        ))
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <main>
      <h1>My Orders</h1>
      <Suspense fallback={<p>Loading your orders…</p>}>
        <MyOrders />
      </Suspense>
    </main>
  );
}
