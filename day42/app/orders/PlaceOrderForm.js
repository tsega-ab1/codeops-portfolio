"use client";

import { useActionState } from "react";
import { placeOrder } from "./actions";

export default function PlaceOrderForm({ dishes }) {
  const [state, formAction, pending] = useActionState(placeOrder, null);

  return (
    <form action={formAction}>
      <label htmlFor="item">New order</label>{" "}
      <select id="item" name="item" defaultValue={dishes[0]}>
        {dishes.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>{" "}
      <button type="submit" disabled={pending}>
        {pending ? "Placing…" : "Place order"}
      </button>
      {state?.error && <p role="alert">{state.error}</p>}
      {state?.ok && <p>Order {state.orderId} placed.</p>}
    </form>
  );
}
