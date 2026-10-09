"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/actions";

const NEXT = { received: "preparing", preparing: "ready", ready: "delivered" };

export default function KitchenControls({ orderId, status }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const next = NEXT[status];

  if (!next) return <span className="muted">—</span>;

  return (
    <>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await updateOrderStatus(orderId, next);
            setError(result.ok ? "" : result.error);
          })
        }
      >
        Mark {next}
      </button>
      {error && <span className="error"> {error}</span>}
    </>
  );
}
