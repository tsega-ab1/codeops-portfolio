"use client";

import Link from "next/link";
import { useCart } from "./useCart";
import { setQty, cartTotal } from "@/lib/cart-store";

export default function CartClient() {
  const { cart, ready } = useCart();

  if (!ready) return <p className="muted">Loading your cart…</p>;
  if (cart.length === 0) {
    return <p>Your cart is empty. <Link href="/menu">Browse the menu</Link>.</p>;
  }

  return (
    <div>
      <table>
        <tbody>
          {cart.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.price} ETB</td>
              <td>
                <button onClick={() => setQty(item.id, item.qty - 1)} aria-label={`Remove one ${item.name}`}>−</button>{" "}
                {item.qty}{" "}
                <button onClick={() => setQty(item.id, item.qty + 1)} aria-label={`Add one ${item.name}`}>+</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><strong>Total: {cartTotal(cart)} ETB</strong></p>
      <Link href="/checkout">Go to checkout</Link>
    </div>
  );
}
