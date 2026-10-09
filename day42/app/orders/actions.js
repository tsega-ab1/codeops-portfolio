"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { findOrder, createOrder, DEMO_MENU } from "@/lib/orders";

// Layer 3: the real authorization boundary. Server Actions are public HTTP
// endpoints — anyone can call them with any arguments — so every check lives here.

export async function placeOrder(_prevState, formData) {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Please sign in to place an order.", orderId: null };
  }

  const item = String(formData.get("item") ?? "");
  if (!Object.hasOwn(DEMO_MENU, item)) {
    return { ok: false, error: "Unknown dish.", orderId: null };
  }

  // Owner comes from the SESSION, price from the SERVER — never from the form.
  const order = createOrder({ userId: session.userId, customer: session.name, item });
  revalidatePath("/orders");
  return { ok: true, error: null, orderId: order.id };
}

export async function cancelOrder(orderId) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const order = findOrder(String(orderId));
  if (!order) throw new Error("Order not found");

  if (order.userId !== session.userId) {
    throw new Error("You are not allowed to cancel this order");
  }

  if (order.status !== "Preparing") {
    throw new Error("Only orders that are still being prepared can be cancelled");
  }

  // Check first, change data second.
  order.status = "Cancelled";
  revalidatePath("/orders");
  revalidatePath(`/orders/${order.id}`);
  return { success: true };
}

// Form wrapper for useActionState: turns thrown errors into messages for the UI.
export async function cancelOrderAction(_prevState, formData) {
  try {
    await cancelOrder(formData.get("orderId"));
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
