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

export const PAYMENT_METHODS = ["CASH", "TELEBIRR"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type Dish = {
  name: string;
  priceSantim: number;
};

export type Order = {
  readonly id: number;
  customer: string; // the name on the order, for display
  customerId?: number; // the USER who placed it: what ownership is decided on
  courierId?: number; // the courier user it is assigned to, once there is one
  area: Area;
  status: OrderStatus;
  restaurantId: number;
  paymentMethod: PaymentMethod;
  dishes: Dish[];
  telebirrPhone?: string;
  totalSantim: number;
};
