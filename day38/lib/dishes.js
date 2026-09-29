import { cacheTag } from "next/cache";
import { cacheLife } from "next/cache";

const dishes = [
  {
    id: "kitfo",
    name: "Kitfo",
    price: 350,
    description: "Traditional Ethiopian minced beef dish.",
    emoji: "🥩",
    category: "ethiopian",
  },
  {
    id: "pizza",
    name: "Pizza",
    price: 500,
    description: "Freshly baked pizza with delicious toppings.",
    emoji: "🍕",
    category: "pizza",
  },
  {
    id: "burger",
    name: "Burger",
    price: 400,
    description: "Juicy beef burger with fresh vegetables.",
    emoji: "🍔",
    category: "burger",
  },
];

// Stands in for a real API call. Tagged "dishes" so an admin action
// can invalidate just this cached data with revalidateTag, without
// touching anything else that's cached.
export async function getDishes() {
  "use cache";
  cacheTag("dishes");
  cacheLife("hours");
  return dishes;
}
