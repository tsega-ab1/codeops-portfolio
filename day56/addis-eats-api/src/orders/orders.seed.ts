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
  restaurantId: number,
  dishes: Dish[],
  telebirrPhone?: string,
): Order {
  const totalSantim = dishes.reduce((sum, d) => sum + d.priceSantim, 0);
  return { id, customer, area, status, restaurantId, dishes, telebirrPhone, totalSantim };
}

// 14 orders: 4 areas, 5 statuses, 4 restaurants. Counts to check your filters against:
//   status  PENDING 4 / PREPARING 3 / ON_THE_WAY 2 / DELIVERED 4 / CANCELLED 1
//   area    Bole 5 / Kazanchis 3 / Piassa 3 / Megenagna 3
//   restaurant 1: 4 orders / 2: 3 / 3: 3 / 4: 4
export const SEED_ORDERS: Order[] = [
  makeOrder(1, "Almaz Bekele", "Bole", "DELIVERED", 1, [DORO_WAT, SHIRO], "0922000001"),
  makeOrder(2, "Dawit Tesfaye", "Piassa", "PENDING", 4, [TIBS]),
  makeOrder(3, "Selam Haile", "Kazanchis", "ON_THE_WAY", 3, [SHIRO], "0922000003"),
  makeOrder(4, "Henok Girma", "Megenagna", "PREPARING", 1, [DORO_WAT, TIBS]),
  makeOrder(5, "Marta Alemu", "Bole", "DELIVERED", 2, [KITFO], "0922000005"),
  makeOrder(6, "Abel Kebede", "Piassa", "CANCELLED", 4, [SHIRO, SHIRO]),
  makeOrder(7, "Tigist Worku", "Kazanchis", "DELIVERED", 3, [KITFO, DORO_WAT], "0922000007"),
  makeOrder(8, "Yonas Mekonnen", "Bole", "PENDING", 2, [TIBS, SHIRO]),
  makeOrder(9, "Hana Tadesse", "Megenagna", "ON_THE_WAY", 1, [DORO_WAT]),
  makeOrder(10, "Biruk Assefa", "Piassa", "PREPARING", 4, [KITFO], "0922000010"),
  makeOrder(11, "Rahel Desta", "Bole", "DELIVERED", 1, [SHIRO, TIBS, DORO_WAT], "0922000011"),
  makeOrder(12, "Kidus Abera", "Kazanchis", "PENDING", 3, [TIBS]),
  makeOrder(13, "Saron Mulugeta", "Bole", "PENDING", 2, [SHIRO]),
  makeOrder(14, "Nahom Berhanu", "Megenagna", "PREPARING", 4, [TIBS, KITFO]),
];
