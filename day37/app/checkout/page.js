import { Suspense } from "react";
import { connection } from "next/server";

async function RenderedAt() {
  // connection() forces just this small part to wait for the actual
  // request — the exact read that makes it dynamic. Wrapping it in
  // Suspense is what lets the rest of the checkout page stay static
  // and prerendered, per the Cache Components model.
  await connection();
  const renderedAt = new Date().toISOString();
  return <p className="server-time">Rendered at: {renderedAt}</p>;
}

export default function CheckoutPage() {
  return (
    <main className="page-container">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-card">
        <div className="checkout-row">
          <span>Kitfo × 1</span>
          <strong>350 ETB</strong>
        </div>
        <div className="checkout-row">
          <span>Pizza × 1</span>
          <strong>500 ETB</strong>
        </div>
        <div className="checkout-row">
          <span>Delivery</span>
          <strong>100 ETB</strong>
        </div>
        <div className="checkout-total">Total: 950 ETB</div>
        <button className="primary-button">Place Order</button>
        <Suspense fallback={<p className="server-time">Loading…</p>}>
          <RenderedAt />
        </Suspense>
      </div>
    </main>
  );
}
