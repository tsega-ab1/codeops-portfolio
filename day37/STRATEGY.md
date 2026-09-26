# Addis Eats — Rendering & Caching Strategy

| Route | Strategy | Why |
|---|---|---|
| `/` | Static | The hero content never changes between builds |
| `/menu` | Cached (`use cache` + `cacheLife("hours")`) | Dishes change occasionally; speed matters most, tagged "dishes" so an admin update can invalidate just this |
| `/menu/[id]` | Static via `generateStaticParams` | Every dish id is known at build time — one HTML file per dish |
| `/cart` | Static (mock data for now) | No request-dependent read yet in this exercise |
| `/checkout` | Dynamic (`connection()`) | Forced to render per-request — the line `await connection()` is the exact read that requires it, standing in for a real session/cookie read |

## Cache invalidation

- `simulateMenuPriceUpdate` (menu page button) calls `revalidateTag("dishes", "max")` — stale-while-revalidate: the next visitor still gets the cached page instantly while Next.js regenerates it behind them.
- `addToCart` (dish page button) calls `updateTag("cart")` — expires immediately, because the person who just acted should see their own change right away.
