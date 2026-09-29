# Addis Eats — Server/Client Boundary

| Component | Runs on | Why |
|---|---|---|
| `app/layout.js` | Server | Passes `children` through; imports nothing that carries `"use client"` |
| `app/page.js` (home) | Server | Static content, no interactivity |
| `app/menu/layout.js` | Server | Renders the sidebar links as plain anchors; no state of its own |
| `app/menu/page.js` | Server (async) | Fetches dishes with `await getDishes()` and reads `searchParams` directly — no hook, no loading flag, no effect |
| `lib/dishes.js` (`getDishes`) | Server only | Uses `"use cache"`, `cacheTag`, `cacheLife` — server-only cache primitives |
| `components/CategoryFilter.jsx` | Client | Holds `category` state and responds to button clicks — the smallest piece that genuinely needs interactivity |
| `components/AddToCartButton.jsx` | Client | Holds its own `count` state and an `onClick` handler |
| `app/menu/[id]/page.js` | Server (async) | Fetches a single dish and calls `notFound()` — no interactivity |
| `app/cart/page.js` | Server | Static mock content, no interactivity yet |
| `app/checkout/page.js` | Server (mostly) + one client-adjacent read | Static shell; only the timestamp piece uses `connection()`, wrapped in `Suspense` — see Day 37's STRATEGY.md |
| `app/menu/error.js` | Client | Needs state and a retry button (`reset()`), so it must be `"use client"` per Next.js's own requirement |
| `app/menu/loading.js` | Server | Pure static markup (skeleton), no interactivity |

## Files containing `"use client"`

Exactly two, both intentionally small:
- `components/CategoryFilter.jsx`
- `components/AddToCartButton.jsx`

`app/menu/error.js` also requires the directive (Next.js enforces this — an error boundary needs a retry handler), bringing the real total to three.

## Composition pattern used

`CategoryFilter` (client) receives `dishes` as a prop from `MenuPage` (server) — an array of plain objects, which can cross the boundary. It does not receive a function or a JSX tree as children in this version, since the dish cards themselves are simple enough to render directly inside the client component rather than being passed in from the server. `AddToCartButton` is imported directly inside `CategoryFilter`, which is fine since both already live on the client side of the boundary — no server code is pulled in by that import.

## No callback props cross the boundary

`MenuPage` never passes a function to `CategoryFilter` — only serializable data (`dishes`, `initialCategory`). All the actual logic (filtering, incrementing) lives inside the client components themselves.
