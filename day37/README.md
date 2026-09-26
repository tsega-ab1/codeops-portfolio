# Day 37 — Layouts & Rendering Strategies

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program. Week 8.

Built against Next.js 16's **Cache Components** model (`cacheComponents: true`), which supersedes the older `revalidate`/`dynamic` export API with `use cache`, `cacheLife`, `cacheTag`, `revalidateTag`, `updateTag`, and `connection()`.

## Route Table (verified with `npm run build`)

| Route | File | Marker | Strategy |
|---|---|---|---|
| `/` | `app/page.js` | ○ Static | Prebuilt once |
| `/menu` | `app/menu/page.js` | ○ Static, revalidates hourly | `use cache` + `cacheLife("hours")` on `getDishes()` |
| `/menu/[id]` | `app/menu/[id]/page.js` | ○ for known ids, ◐ fallback | `generateStaticParams()` prebuilds kitfo, pizza, burger |
| `/cart` | `app/cart/page.js` | ○ Static | No dynamic read yet |
| `/checkout` | `app/checkout/page.js` | ◐ Partial Prerender | Static shell + one Suspense-wrapped `connection()` read |

Full detail and reasoning in `STRATEGY.md`.

## Layouts

- `app/layout.js` — root layout, owns `<html>`/`<body>`, imports `globals.css`, renders `Header` and a footer
- `app/menu/layout.js` — nested layout adding the category sidebar; proven to persist (stay mounted) when navigating from `/menu` to `/menu/kitfo` — only the right-hand content swaps

## Cache Components in Practice

- **`use cache`** — marks `getDishes()` in `lib/dishes.js` as cacheable
- **`cacheLife("hours")`** — the cached menu data is valid for the built-in "hours" profile
- **`cacheTag("dishes")`** — labels the cached menu data so it can be invalidated by name
- **`revalidateTag("dishes", "max")`** — triggered by a demo button on the menu page (`simulateMenuPriceUpdate` server action); stale-while-revalidate, so the next visitor still gets the cached page instantly while Next.js regenerates it behind them
- **`updateTag("cart")`** — triggered by "Add to Cart" on a dish page (`addToCart` server action); expires immediately, since the person who just acted should see their own change right away
- **`connection()`** — forces the checkout timestamp to wait for the real request; must sit inside its own `<Suspense>` boundary, or the whole route fails to prerender (learned the hard way — see `STRATEGY.md`)

## Streaming

- `app/menu/loading.js` — skeleton cards shown for the whole `/menu` segment while it loads
- A finer `<Suspense>` boundary inside `MenuPage` itself wraps just the `DishList` component (the part that actually reads data), so `CategoryBar` and the rest of the shell render immediately

## Verified

- `npm run build` lists every expected route with the correct marker, and no extras
- Navigating `/menu` → `/menu/kitfo` keeps the sidebar mounted (layout persistence)
- `/menu/does-not-exist` shows "Dish not found"
- `/checkout` shows a `Rendered at:` timestamp that changes on every request — proving the Partial Prerender's dynamic slice actually re-executes
- Throttling the network briefly reveals the menu's skeleton loading state
