"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, destroySession, getSession } from "@/lib/session";
import {
  findUserByPhone,
  verifyPassword,
  createOrderAs,
  cancelOrderAs,
  setStatusAs
} from "@/lib/db";
import { safeNext } from "@/lib/safe-redirect.mjs";

export async function signIn(_prevState, formData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next")); // validated again on the server

  const user = findUserByPhone(phone);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Wrong phone number or password." };
  }

  await createSession(user.id);
  redirect(next);
}

export async function signOut() {
  await destroySession();
  redirect("/");
}

export async function placeOrder(items) {
  const user = await getSession();
  const result = await createOrderAs(user, items);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/orders");
  revalidatePath("/kitchen");
  return { ok: true, orderId: result.order.id };
}

export async function cancelOrder(orderId) {
  const user = await getSession();
  const result = cancelOrderAs(user, String(orderId));
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/orders");
  revalidatePath("/kitchen");
  return { ok: true };
}

export async function updateOrderStatus(orderId, status) {
  const user = await getSession();
  const result = setStatusAs(user, String(orderId), String(status));
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/kitchen");
  revalidatePath("/orders");
  return { ok: true };
}
