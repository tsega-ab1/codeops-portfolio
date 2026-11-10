// Day 52 - In-class exercise: Typing the Addis Eats Order
// Money rule: every price is an integer count of santim (100 santim = 1 ETB).
// Divide by 100 only when displaying, and only inside formatEtb.

// 1. Area: a union built from an `as const` array
export const AREAS = ["Bole", "Kazanchis", "Piassa", "Megenagna"] as const;
export type Area = (typeof AREAS)[number];

// 2. OrderStatus: a union of the five order states
export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

// 3. Dish and Order
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
  telebirrPhone?: string; // optional: may not have been collected yet
  totalSantim: number; // sum of the dish prices, before delivery
};

// The one and only place an ETB amount is formatted
export function formatEtb(santim: number): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
  }).format(santim / 100);
}

// 4. deliveryFee: free from 500 ETB, 40 ETB to Bole, 60 ETB elsewhere
const FREE_DELIVERY_FROM_SANTIM = 50000;
const BOLE_FEE_SANTIM = 4000;
const OTHER_FEE_SANTIM = 6000;

export function deliveryFee(order: Order): number {
  if (order.totalSantim >= FREE_DELIVERY_FROM_SANTIM) {
    return 0;
  } else if (order.area === "Bole") {
    return BOLE_FEE_SANTIM;
  }
  return OTHER_FEE_SANTIM;
}

// 5. statusMessage: exhaustive switch with a `never` default
export function statusMessage(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "Waiting for the restaurant to accept";
    case "PREPARING":
      return "Your food is being cooked";
    case "ON_THE_WAY":
      return "The rider has left the restaurant";
    case "DELIVERED":
      return "Delivered - enjoy your meal";
    case "CANCELLED":
      return "This order was cancelled";
    default: {
      // If a sixth status is added to the union, this line stops compiling
      const unreachable: never = status;
      return unreachable;
    }
  }
}

// 6. receipt: multi-line template literal, every ETB amount via formatEtb
export function receipt(order: Order): string {
  const fee = deliveryFee(order);
  const lines = order.dishes
    .map((d) => `  ${d.name.padEnd(12)} ${formatEtb(d.priceSantim)}`)
    .join("\n");

  return `
  Addis Eats - Order #${order.id}
  Customer: ${order.customer}
  Area:     ${order.area}
  Status:   ${statusMessage(order.status)}
${lines}
  Subtotal: ${formatEtb(order.totalSantim)}
  Delivery: ${formatEtb(fee)}
  Total:    ${formatEtb(order.totalSantim + fee)}
  TeleBirr: ${order.telebirrPhone ?? "not provided"}
`;
}

// ---- Demo: run with `node dist/order.js` ----
const sampleOrders: Order[] = [
  {
    id: 4821,
    customer: "Almaz Bekele",
    area: "Bole",
    status: "PREPARING",
    dishes: [
      { name: "Doro Wat", priceSantim: 32000 },
      { name: "Shiro", priceSantim: 18000 },
    ],
    telebirrPhone: "0922000001",
    totalSantim: 50000,
  },
  {
    id: 4822,
    customer: "Dawit Tesfaye",
    area: "Piassa",
    status: "PENDING",
    dishes: [{ name: "Tibs", priceSantim: 29000 }],
    totalSantim: 29000,
  },
  {
    id: 4823,
    customer: "Selam Haile",
    area: "Kazanchis",
    status: "ON_THE_WAY",
    dishes: [{ name: "Shiro", priceSantim: 18000 }],
    telebirrPhone: "0922000003",
    totalSantim: 18000,
  },
  {
    id: 4824,
    customer: "Henok Girma",
    area: "Megenagna",
    status: "DELIVERED",
    dishes: [
      { name: "Doro Wat", priceSantim: 32000 },
      { name: "Tibs", priceSantim: 29000 },
    ],
    totalSantim: 61000,
  },
];

for (const order of sampleOrders) {
  console.log(receipt(order));
}
