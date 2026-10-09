import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAllOrders } from "@/lib/orders";
import SignOutButton from "@/app/_components/SignOutButton";

async function KitchenContent() {
  const session = await getSession();
  if (!session) redirect("/signin?next=/kitchen");

  // Server-side role check. Hiding a link is UI; this is security.
  if (session.role !== "staff") {
    return (
      <>
        <h1>Forbidden</h1>
        <p>This page is available only to staff.</p>
      </>
    );
  }

  const orders = getAllOrders();

  return (
    <>
      <h1>Kitchen</h1>
      <p>Staff order management — signed in as {session.name}.</p>
      <SignOutButton />
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            {o.id}: {o.item} — {o.status} (customer {o.userId})
          </li>
        ))}
      </ul>
    </>
  );
}

export default function KitchenPage() {
  return (
    <main>
      <Suspense fallback={<p>Loading…</p>}>
        <KitchenContent />
      </Suspense>
    </main>
  );
}
