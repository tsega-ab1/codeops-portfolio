import type { Area, Dish, Order, OrderStatus } from "./order.types.js";

const DORO_WAT: Dish = { name: "Doro Wat", priceSantim: 32000 };
const SHIRO: Dish = { name: "Shiro", priceSantim: 18000 };
const TIBS: Dish = { name: "Tibs", priceSantim: 29000 };
const KITFO: Dish = { name: "Kitfo", priceSantim: 35000 };

// Computes the total from the dishes, so the two can never disagree
function makeOrder(
  id: number,
  customer: string,
  area: Area,
  status: OrderStatus,
  dishes: Dish[],
  telebirrPhone?: string,
): Order {
  const totalSantim = dishes.reduce((sum, d) => sum + d.priceSantim, 0);
  return { id, customer, area, status, dishes, telebirrPhone, totalSantim };
}

export const SEED_ORDERS: Order[] = [
  makeOrder(1, "Almaz Bekele", "Bole", "DELIVERED", [DORO_WAT, SHIRO], "0922000001"),
  makeOrder(2, "Dawit Tesfaye", "Piassa", "PENDING", [TIBS]),
  makeOrder(3, "Selam Haile", "Kazanchis", "ON_THE_WAY", [SHIRO], "0922000003"),
  makeOrder(4, "Henok Girma", "Megenagna", "PREPARING", [DORO_WAT, TIBS]),
  makeOrder(5, "Marta Alemu", "Bole", "DELIVERED", [KITFO], "0922000005"),
  makeOrder(6, "Abel Kebede", "Piassa", "CANCELLED", [SHIRO, SHIRO]),
  makeOrder(7, "Tigist Worku", "Kazanchis", "DELIVERED", [KITFO, DORO_WAT], "0922000007"),
  makeOrder(8, "Yonas Mekonnen", "Bole", "PENDING", [TIBS, SHIRO]),
  makeOrder(9, "Hana Tadesse", "Megenagna", "ON_THE_WAY", [DORO_WAT]),
  makeOrder(10, "Biruk Assefa", "Piassa", "PREPARING", [KITFO], "0922000010"),
  makeOrder(11, "Rahel Desta", "Bole", "DELIVERED", [SHIRO, TIBS, DORO_WAT], "0922000011"),
  makeOrder(12, "Kidus Abera", "Kazanchis", "PENDING", [TIBS]),
];
