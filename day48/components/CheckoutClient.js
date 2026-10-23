"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./useCart";
import { clearCart, cartTotal } from "@/lib/cart-store";
import { placeOrder } from "@/app/actions";

// crypto.randomUUID exists only in secure contexts (HTTPS or localhost), so testing from a
// phone over http://192.168.x.x needs a fallback. getRandomValues works everywhere.
function newKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function CheckoutClient() {
  const { cart, ready } = useCart();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const orderKey = useRef(null); // one key per checkout attempt; retries reuse it
  const busy = useRef(false);    // blocks a second tap before React re-renders

  if (!ready) return <p className="muted">Loading your cart…</p>;
  if (cart.length === 0) return <p>Your cart is empty.</p>;

  function submit(event) {
    event.preventDefault();          // Enter and tap both land here
    if (busy.current) return;        // a double tap in the same instant
    busy.current = true;
    setError("");
    orderKey.current ??= newKey();

    startTransition(async () => {
      try {
        // Only ids and quantities are sent. The server prices the order.
        const items = cart.map(({ id, qty }) => ({ id, qty }));
        const result = await placeOrder(items, orderKey.current);
        if (!result.ok) {
          setError(result.error);
          busy.current = false;
          return;
        }
        clearCart();
        router.push(`/orders/${result.orderId}`); // leaving the page, so busy stays true
      } catch {
        setError("Could not place the order. Check your connection and try again.");
        busy.current = false;        // same key on retry, so no duplicate order
      }
    });
  }

  return (
    <form onSubmit={submit} aria-busy={pending}>
      <ul>
        {cart.map((i) => <li key={i.id}>{i.qty} × {i.name}</li>)}
      </ul>
      <p><strong>Estimated total: {cartTotal(cart)} ETB</strong> <span className="muted">(final price is set by the server)</span></p>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Placing order…" : "Place order"}</button>
    </form>
  );
}
