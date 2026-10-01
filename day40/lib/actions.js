"use server";

import { revalidateTag, updateTag } from "next/cache";

// Simulates an admin changing a menu price. Uses revalidateTag, which
// is stale-while-revalidate: the next visitor still gets the cached
// page instantly while Next.js regenerates it behind them.
export async function simulateMenuPriceUpdate() {
  revalidateTag("dishes", "max");
}

// Simulates adding a dish to the cart. Uses updateTag, which expires
// the tagged cache immediately, because the person who just acted
// should see their own change right away.
export async function addToCart() {
  updateTag("cart");
}
