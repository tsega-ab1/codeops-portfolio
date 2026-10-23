import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getOrderAs } from "@/lib/db";
import { formatETB, relative, when } from "@/lib/format";
import { DEFAULT_DELIVERY } from "@/lib/tracking";
import OrderStatus from "@/components/OrderStatus";

export const metadata = { title: "Order details", robots: { index: false, follow: false } };

export default async function OrderPage({ params }) {
  const { id } = await params;

  const user = await getSession();
  if (!user) redirect(`/signin?next=/orders/${id}`);

  // Someone else's order looks exactly like an order that does not exist.
  const order = getOrderAs(user, id);
  if (!order) notFound();

  return (
    <article>
      <h1>Order {order.id}</h1>
      <p>Placed {relative(order.createdAt)} · {when.format(new Date(order.createdAt))}</p>
      <ul>
        {order.items.map((item) => (
          <li key={item.dishId}>{item.qty} × {item.name} — {formatETB(item.price * item.qty)}</li>
        ))}
      </ul>
      <p><strong>Total: {formatETB(order.total)}</strong></p>

      <OrderStatus
        orderId={order.id}
        initialOrder={{ id: order.id, status: order.status }}
        delivery={order.delivery ?? DEFAULT_DELIVERY}
      />

      <p><Link href="/orders">← All orders</Link></p>
    </article>
  );
}
