"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./useCart";
import { clearCart, cartTotal } from "@/lib/cart-store";
import { placeOrder } from "@/app/actions";

export default function CheckoutClient() {
  const { cart, ready } = useCart();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!ready) return <p className="muted">Loading your cart…</p>;
  if (cart.length === 0) return <p>Your cart is empty.</p>;

  function submit() {
    setError("");
    startTransition(async () => {
      // Only ids and quantities are sent. The server prices the order.
      const result = await placeOrder(cart.map(({ id, qty }) => ({ id, qty })));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      clearCart();
      router.push(`/orders/${result.orderId}`);
    });
  }

  return (
    <div>
      <ul>
        {cart.map((i) => <li key={i.id}>{i.qty} × {i.name}</li>)}
      </ul>
      <p><strong>Estimated total: {cartTotal(cart)} ETB</strong> <span className="muted">(final price is set by the server)</span></p>
      {error && <p className="error" role="alert">{error}</p>}
      <button onClick={submit} disabled={pending}>{pending ? "Placing order…" : "Place order"}</button>
    </div>
  );
}
