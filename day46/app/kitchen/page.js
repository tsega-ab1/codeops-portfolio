import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getKitchenOrdersAs } from "@/lib/db";
import KitchenControls from "@/components/KitchenControls";

export const metadata = { title: "Kitchen", robots: { index: false, follow: false } };

export default async function KitchenPage() {
  const user = await getSession();
  if (!user) redirect("/signin?next=/kitchen");

  // The role check is the protection. Hiding the nav link is only polish.
  if (user.role !== "staff") {
    return (
      <section>
        <h1>Not allowed</h1>
        <p>This area is for kitchen staff.</p>
      </section>
    );
  }

  const orders = getKitchenOrdersAs(user);

  return (
    <section>
      <h1>Kitchen</h1>
      <p>Manage incoming orders.</p>
      <table>
        <thead>
          <tr><th>Order</th><th>Items</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}</td>
              <td style={{ textTransform: "capitalize" }}>{order.status}</td>
              <td><KitchenControls orderId={order.id} status={order.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
