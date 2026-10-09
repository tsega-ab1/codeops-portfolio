// One in-memory order store for the whole app. Each order has a userId (owner).
// `orders` stays exported by id because the Day 40-41 code imports it that way.
export const orders = (globalThis.__addisOrders ??= {
  "1001": { id: "1001", userId: "demo-user-1", customer: "Abebe", item: "Doro Wot", status: "Preparing", total: 1250 },
  "1002": { id: "1002", userId: "demo-user-2", customer: "Marta", item: "Tibs", status: "Ready", total: 850 },
  "1003": { id: "1003", userId: "demo-user-1", customer: "Abebe", item: "Shiro", status: "Preparing", total: 220 },
});

// Prices live on the SERVER. Never trust a price or total sent from the browser.
// Swap this for your real dishes data if you like.
export const DEMO_MENU = {
  "Doro Wot": 450,
  "Tibs": 380,
  "Shiro": 220,
  "Kitfo": 520,
};

export function getOrdersFor(userId) {
  return Object.values(orders).filter((o) => o.userId === userId);
}

export function getAllOrders() {
  return Object.values(orders);
}

export function findOrder(id) {
  return orders[id] ?? null;
}

// Staff can see any order; customers only their own.
export function canViewOrder(session, order) {
  return session.role === "staff" || order.userId === session.userId;
}

export function createOrder({ userId, customer, item }) {
  const nextId = String(Math.max(1000, ...Object.keys(orders).map(Number)) + 1);
  const order = { id: nextId, userId, customer, item, status: "Preparing", total: DEMO_MENU[item] };
  orders[nextId] = order;
  return order;
}
