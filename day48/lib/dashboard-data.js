// Demo analytics dataset. Seeded, so reloads and tests are stable.
// Money = whole birr integers. Timestamps = UTC ISO strings, bucketed by Addis (EAT) day.
export const TIME_ZONE = "Africa/Addis_Ababa";
export const RANGE_LABEL = "1–30 June 2026";
export const PAGE_SIZE = 20;

const AREAS = [
  ["Bole", 5], ["Kazanchis", 3], ["CMC", 3], ["Piassa", 2], ["Megenagna", 2], ["Sarbet", 1],
];
const MENU = [["Doro Wat", 450], ["Tibs", 550], ["Shiro", 220], ["Kitfo", 520], ["Firfir", 300]];
const STATUSES = ["Delivered", "Delivered", "Delivered", "Delivered", "Preparing", "Cancelled"];

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(rand, pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [value, w] of pairs) { if ((r -= w) <= 0) return value; }
  return pairs[0][0];
}

function build() {
  const rand = mulberry32(46);
  const start = Date.UTC(2026, 5, 1);
  const raw = Array.from({ length: 140 }, () => {
    const day = Math.floor(rand() * 30);
    const hour = 5 + Math.floor(rand() * 14);   // UTC 05–18 = EAT 08–21
    const minute = Math.floor(rand() * 60);
    const [item, price] = MENU[Math.floor(rand() * MENU.length)];
    const qty = 1 + Math.floor(rand() * 4);
    return {
      placedAt: new Date(start + day * 864e5 + hour * 36e5 + minute * 6e4).toISOString(),
      area: pickWeighted(rand, AREAS),
      item,
      total: price * qty,
      status: STATUSES[Math.floor(rand() * STATUSES.length)],
    };
  });
  raw.sort((a, b) => a.placedAt.localeCompare(b.placedAt));
  return raw.map((o, i) => ({ id: 2001 + i, ...o }));
}

const ALL = build();
export function getAllDashboardOrders() { return ALL; }

// ---- aggregation (runs on the server; only the summaries cross to the browser) ----
export function revenueByArea(orders) {
  const map = new Map();
  for (const o of orders) map.set(o.area, (map.get(o.area) ?? 0) + o.total);
  return [...map.entries()].map(([area, revenue]) => ({ area, revenue })).sort((a, b) => b.revenue - a.revenue);
}

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TIME_ZONE });

export function ordersPerDay(orders) {
  const start = Date.UTC(2026, 5, 1);
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(start + i * 864e5);
    return { key: dayKey.format(d), label: dayLabel.format(d), orders: 0 };
  });
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const o of orders) {
    const day = byKey.get(dayKey.format(new Date(o.placedAt)));
    if (day) day.orders += 1;
  }
  return days.map(({ label, orders }) => ({ label, orders }));
}

// ---- sorting + paging: the URL is untrusted input, so everything is whitelisted ----
export const SORT_COLUMNS = {
  id: { label: "Order", type: "number", defaultDir: "asc" },
  area: { label: "Area", type: "string", defaultDir: "asc" },
  item: { label: "Dish", type: "string", defaultDir: "asc" },
  status: { label: "Status", type: "string", defaultDir: "asc" },
  date: { label: "Placed", type: "string", defaultDir: "desc" },
  total: { label: "Total", type: "number", defaultDir: "desc" },
};
const FIELD = { id: "id", area: "area", item: "item", status: "status", date: "placedAt", total: "total" };

export function parseListParams(sp) {
  const first = (v) => (Array.isArray(v) ? v[0] : v);
  const sort = Object.hasOwn(SORT_COLUMNS, first(sp.sort)) ? first(sp.sort) : "date";
  const dir = first(sp.dir) === "asc" || first(sp.dir) === "desc" ? first(sp.dir) : SORT_COLUMNS[sort].defaultDir;
  const n = Number.parseInt(first(sp.page) ?? "1", 10);
  return { sort, dir, page: Number.isFinite(n) && n > 0 ? n : 1 };
}

export function sortAndPage(orders, { sort, dir, page }) {
  const field = FIELD[sort];
  const sign = dir === "asc" ? 1 : -1;
  const sorted = [...orders].sort((a, b) => {
    const av = a[field], bv = b[field];
    const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
    return cmp * sign || a.id - b.id;
  });
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  return { rows, total: sorted.length, page: current, pages, sort, dir };
}

export function listHref({ sort, dir, page, demo }) {
  const q = new URLSearchParams({ sort, dir, page: String(page) });
  if (demo) q.set("demo", demo);
  return `/dashboard?${q}`;
}
