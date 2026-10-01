import { cacheTag } from "next/cache";
import { cacheLife } from "next/cache";
import { dishes } from "./dishes-data.js";

export { dishes };

// Cached version used by the menu page (Day 37/38). Stands in for a
// real API call. Tagged "dishes" so an admin action can invalidate
// just this cached data with revalidateTag, without touching
// anything else that's cached.
export async function getDishes() {
  "use cache";
  cacheTag("dishes");
  cacheLife("hours");
  return dishes;
}
