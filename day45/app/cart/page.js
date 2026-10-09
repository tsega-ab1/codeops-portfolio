import CartClient from "@/components/CartClient";

export const metadata = { title: "Cart", robots: { index: false, follow: false } };

export default function CartPage() {
  return (
    <section>
      <h1>Your cart</h1>
      <CartClient />
    </section>
  );
}
