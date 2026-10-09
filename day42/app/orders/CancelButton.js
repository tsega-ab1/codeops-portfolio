"use client";

import { useActionState } from "react";
import { cancelOrderAction } from "./actions";

export default function CancelButton({ orderId }) {
  const [state, formAction, pending] = useActionState(cancelOrderAction, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel order"}
      </button>
      {state?.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
