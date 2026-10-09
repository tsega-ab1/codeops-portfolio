import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canViewOrder } from "@/lib/orders";
import { getOrder } from "@/lib/orders-api";
import OrderStatus from "./OrderStatus";

export default async function OrderPage({ params }) {
  const { id } = await params;

  // Layer 2: verified session, not just "a cookie exists".
  const session = await getSession();
  if (!session) redirect(`/signin?next=${encodeURIComponent(`/orders/${id}`)}`);

  const order = await getOrder(id);

  // Same message for "missing" and "not yours": don't reveal which orders exist.
  if (!order || !canViewOrder(session, order)) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold">Order not found</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Order Status</h1>
      <OrderStatus id={id} initialOrder={order} />
    </main>
  );
}
