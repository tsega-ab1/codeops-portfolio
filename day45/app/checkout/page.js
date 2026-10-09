import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import CheckoutClient from "@/components/CheckoutClient";

export const metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const user = await getSession();
  if (!user) redirect("/signin?next=/checkout");

  return (
    <section>
      <h1>Checkout</h1>
      <p className="muted">Signed in as {user.name}.</p>
      <CheckoutClient />
    </section>
  );
}
