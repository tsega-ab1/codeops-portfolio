// Money rule: prices are integers of santim (100 santim = 1 ETB).
import type { Area } from "../common/area.js";

export { AREAS } from "../common/area.js";
export type { Area } from "../common/area.js";

// A real array AND a type: the array lets validators check a value at runtime
export const ORDER_STATUSES = [
  "PENDING",
  "PREPARING",
  "ON_THE_WAY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Dish = {
  name: string;
  priceSantim: number;
};

export type Order = {
  readonly id: number;
  customer: string;
  area: Area;
  status: OrderStatus;
  restaurantId: number; // new: which restaurant is cooking it
  dishes: Dish[];
  telebirrPhone?: string;
  totalSantim: number;
};
