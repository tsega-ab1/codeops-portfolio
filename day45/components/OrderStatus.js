"use client";

import { useState, useTransition } from "react";
import useSWR from "swr";
import { cancelOrder } from "@/app/actions";

const TERMINAL = ["delivered", "cancelled"];

const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Request failed");
  return response.json();
};

// The server renders the first status (fallbackData). SWR then keeps it fresh.
export default function OrderStatus({ orderId, initialOrder }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const { data, mutate } = useSWR(`/api/orders/${orderId}/status`, fetcher, {
    fallbackData: initialOrder,
    refreshInterval: (latest) => (TERMINAL.includes(latest?.status) ? 0 : 5000)
  });

  function cancel() {
    setError("");
    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (!result.ok) setError(result.error);
      await mutate();
    });
  }

  return (
    <section aria-live="polite">
      <h2>Order status</h2>
      <p><strong style={{ textTransform: "capitalize" }}>{data?.status}</strong></p>
      {data?.status === "received" && (
        <button onClick={cancel} disabled={pending}>{pending ? "Cancelling…" : "Cancel order"}</button>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
