import type { Dish } from "./dish.types.js";

// Eight dishes across the four restaurants (two each)
export const SEED_DISHES: Dish[] = [
  { id: 1, restaurantId: 1, name: "Doro Wat", priceSantim: 32000 },
  { id: 2, restaurantId: 1, name: "Kitfo", priceSantim: 35000 },
  { id: 3, restaurantId: 2, name: "Shiro", priceSantim: 18000 },
  { id: 4, restaurantId: 2, name: "Tibs", priceSantim: 29000 },
  { id: 5, restaurantId: 3, name: "Firfir", priceSantim: 22000 },
  { id: 6, restaurantId: 3, name: "Gored Gored", priceSantim: 36000 },
  { id: 7, restaurantId: 4, name: "Kikil", priceSantim: 26000 },
  { id: 8, restaurantId: 4, name: "Dulet", priceSantim: 24000 },
];
