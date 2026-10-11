// In-memory stand-in for the backend API. Swap this file (and lib/dishes.js)
// for fetch() calls if you have a real API. Every rule that protects data
// lives here, so server actions and route handlers cannot drift apart.
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { getDish } from "./dishes";

export const STATUSES = ["received", "preparing", "ready", "delivered", "cancelled"];

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 32);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function seed() {
  const passwordHash = hashPassword("addis123");
  return {
    nextOrder: 813,
    users: [
      { id: "usr_31", name: "Almaz", phone: "0911000001", role: "customer", passwordHash },
      { id: "usr_32", name: "Dawit", phone: "0911000002", role: "customer", passwordHash },
      { id: "usr_10", name: "Staff Member", phone: "0911000010", role: "staff", passwordHash }
    ],
    orders: [
      {
        id: "ord_812", userId: "usr_31", status: "received", total: 320,
        createdAt: "2026-10-09T08:15:00.000Z",
        items: [{ dishId: "kitfo", name: "Kitfo", price: 320, qty: 1 }]
      },
      {
        id: "ord_790", userId: "usr_32", status: "preparing", total: 900,
        createdAt: "2026-10-09T07:40:00.000Z",
        items: [{ dishId: "doro-wat", name: "Doro Wat", price: 450, qty: 2 }]
      }
    ]
  };
}

// Survives hot reloads in dev.
globalThis.__addisEatsDb ??= seed();
const db = globalThis.__addisEatsDb;

/* ---------- users ---------- */

export function getUserById(id) {
  return db.users.find((u) => u.id === id) ?? null;
}

export function findUserByPhone(phone) {
  return db.users.find((u) => u.phone === phone) ?? null;
}

/* ---------- reads (always scoped to the caller) ---------- */

export function getOrdersFor(userId) {
  return db.orders
    .filter((o) => o.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Owner or staff only. Anyone else gets null, same as "does not exist".
export function getOrderAs(user, id) {
  if (!user) return null;
  const order = db.orders.find((o) => o.id === id);
  if (!order) return null;
  if (order.userId !== user.id && user.role !== "staff") return null;
  return order;
}

export function getKitchenOrdersAs(user) {
  if (!user || user.role !== "staff") return null;
  return [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ---------- writes (each one re-checks who is asking) ---------- */

export async function createOrderAs(user, items) {
  if (!user) return { ok: false, status: 401, error: "Not signed in" };
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    return { ok: false, status: 400, error: "Your cart is empty or invalid" };
  }

  const lines = [];
  for (const item of items) {
    const qty = Number(item?.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      return { ok: false, status: 400, error: "Invalid quantity" };
    }
    // Price comes from the server, never from the browser.
    const dish = await getDish(String(item?.id));
    if (!dish) return { ok: false, status: 400, error: "Unknown dish in cart" };
    lines.push({ dishId: dish.id, name: dish.name, price: dish.price, qty });
  }

  const order = {
    id: `ord_${db.nextOrder++}`,
    userId: user.id,
    status: "received",
    items: lines,
    total: lines.reduce((sum, l) => sum + l.price * l.qty, 0),
    createdAt: new Date().toISOString()
  };
  db.orders.push(order);
  return { ok: true, order };
}

export function cancelOrderAs(user, id) {
  if (!user) return { ok: false, status: 401, error: "Not signed in" };

  const order = db.orders.find((o) => o.id === id);
  if (!order) return { ok: false, status: 404, error: "Order not found" };

  if (order.userId !== user.id) return { ok: false, status: 403, error: "Not allowed" };

  if (order.status !== "received") {
    return { ok: false, status: 409, error: "This order can no longer be cancelled" };
  }

  order.status = "cancelled";
  return { ok: true, order };
}

export function setStatusAs(user, id, status) {
  if (!user) return { ok: false, status: 401, error: "Not signed in" };
  if (user.role !== "staff") return { ok: false, status: 403, error: "Staff only" };

  if (!STATUSES.includes(status)) return { ok: false, status: 400, error: "Invalid status" };

  const order = db.orders.find((o) => o.id === id);
  if (!order) return { ok: false, status: 404, error: "Order not found" };

  order.status = status;
  return { ok: true, order };
}
