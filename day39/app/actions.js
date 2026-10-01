"use server";

import { orderSchema } from "@/lib/schema";
import { dishes } from "@/lib/dishes";
import { orders } from "@/lib/orders";
import { revalidatePath } from "next/cache";

export async function placeOrder(previousState, formData) {
  const result = orderSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    dishId: formData.get("dishId"),
  });

  if (!result.success) {
    return {
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors,
      success: false,
    };
  }

  const dish = dishes.find((dish) => dish.id === result.data.dishId);

  if (!dish) {
    return {
      error: "Dish not found",
      fieldErrors: {},
      success: false,
    };
  }

  const order = {
    id: `ord-${Date.now()}`,
    name: result.data.name,
    phone: result.data.phone,
    dishId: dish.id,
    total: dish.price,
    currency: "ETB",
  };

  orders.push(order);

  revalidatePath("/orders");

  return {
    success: true,
    orderId: order.id,
    error: "",
    fieldErrors: {},
  };
}

// Demonstrates the authorization pattern from the reading sheet.
// There's no real auth system yet, so getCurrentUser is mocked —
// the important part is WHERE the ownership check happens.
async function getCurrentUser() {
  // In a real app this reads the session. For this exercise, there
  // is no signed-in user yet, so every call is treated as unauthenticated
  // unless a matching phone is explicitly passed in.
  return null;
}

export async function cancelOrder(orderId) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Not signed in" };
  }

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.phone !== user.phone) {
    return { error: "You are not allowed to cancel this order" };
  }

  order.cancelled = true;
  revalidatePath("/orders");

  return { success: true };
}
