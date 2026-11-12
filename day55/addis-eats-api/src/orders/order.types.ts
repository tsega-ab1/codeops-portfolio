// Money rule: prices are integers of santim (100 santim = 1 ETB).
import type { Area } from "../common/area.js";

// AREAS and Area now live in common/area.ts - re-exported so nothing else changes
export { AREAS } from "../common/area.js";
export type { Area } from "../common/area.js";

export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

export type Dish = {
  name: string;
  priceSantim: number;
};

export type Order = {
  readonly id: number;
  customer: string;
  area: Area;
  status: OrderStatus;
  dishes: Dish[];
  telebirrPhone?: string;
  totalSantim: number;
};
