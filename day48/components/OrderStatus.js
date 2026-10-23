"use client";

import { useEffect, useState, useTransition } from "react";
import { cancelOrder } from "@/app/actions";
import MapPanel from "./MapPanel";
import { DEFAULT_DELIVERY, etaMinutes, stageText } from "@/lib/tracking";

const TERMINAL = ["delivered", "cancelled"];
const LABEL = {
  connecting: "Connecting…",
  live: "Live",
  reconnecting: "Reconnecting…",
  offline: "Offline: checking every 5 seconds",
  done: "Final status",
};

// Server renders the first status (initialOrder). The stream only updates it.
export default function OrderStatus({ orderId, initialOrder, delivery = DEFAULT_DELIVERY }) {
  const [status, setStatus] = useState(initialOrder.status);
  const [connection, setConnection] = useState("connecting");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // 1) Server-sent events, closed on unmount and when the order is final.
  useEffect(() => {
    if (TERMINAL.includes(initialOrder.status)) {
      setConnection("done");
      return;
    }
    const es = new EventSource(`/api/orders/${orderId}/stream`);
    es.onopen = () => setConnection("live");
    es.onmessage = (e) => {
      const next = JSON.parse(e.data);
      setStatus(next.status);
      if (TERMINAL.includes(next.status)) {
        es.close(); // otherwise the browser reconnects after the server hangs up
        setConnection("done");
      }
    };
    es.onerror = () =>
      setConnection(es.readyState === EventSource.CLOSED ? "offline" : "reconnecting");
    return () => es.close();
  }, [orderId, initialOrder.status]);

  // 2) Fallback: if the stream is refused, poll the status route instead.
  useEffect(() => {
    if (connection !== "offline") return;
    let stopped = false;
    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (!res.ok || stopped) return;
        const data = await res.json();
        setStatus(data.status);
        if (TERMINAL.includes(data.status)) setConnection("done");
      } catch {}
    }
    poll();
    const timer = setInterval(poll, 5000);
    return () => { stopped = true; clearInterval(timer); };
  }, [connection, orderId]);

  function cancel() {
    setError("");
    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (!result.ok) setError(result.error);
      const res = await fetch(`/api/orders/${orderId}/status`);
      if (res.ok) setStatus((await res.json()).status);
    });
  }

  const eta = etaMinutes(status);

  return (
    <section aria-live="polite">
      <h2>Order status</h2>
      <p><strong style={{ textTransform: "capitalize" }}>{status}</strong></p>
      <p className="live-indicator" role="status">● {LABEL[connection]}</p>

      {status === "received" && (
        <button type="button" onClick={cancel} disabled={pending}>
          {pending ? "Cancelling…" : "Cancel order"}
        </button>
      )}
      {error && <p className="error" role="alert">{error}</p>}

      {status !== "cancelled" && (
        <>
          <h3>Delivery</h3>
          <ul>
            <li>Delivering to: {delivery.address} ({delivery.area})</li>
            <li>Courier: {stageText(status)}</li>
            {eta > 0 && <li>Estimated arrival: about {eta} minutes</li>}
          </ul>
          <MapPanel status={status} delivery={delivery} />
        </>
      )}
    </section>
  );
}
