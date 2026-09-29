# Day 38 — Server & Client Components

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program. Week 8.

## What Today Covered

The idea underneath the last two days: in the App Router, a component runs on the server unless told otherwise, ships no JavaScript, and can fetch data directly with no hook, no loading flag, and no API route in between.

## The Exercise: Before and After

Started from a deliberately over-clientized `/menu` page — `"use client"` at the top, `useState` + `useEffect` faking a fetch, and all the dish markup and cart logic bundled together, exactly the Day 26–34 Vite habit. Then sorted it properly:

- `app/menu/page.js` became a plain **async server component** — no directive, awaits `getDishes()` directly, reads `searchParams` as a prop
- Only two client components remain, each the smallest piece that genuinely needs interactivity: `CategoryFilter.jsx` (holds the selected category) and `AddToCartButton.jsx` (holds its own count)
- Full breakdown in `BOUNDARY.md`

## Bundle Measurement

Measured `/menu`'s transferred JS in a production build (`npm run build && npm run start`), in an Incognito window with the Network tab's JS filter, to exclude browser extension noise.

| | Transferred JS |
|---|---|
| Before (whole page client-rendered) | 141 kB |
| After (sorted: server page + 2 small client leaves) | 141 kB |

**Honest finding: no measurable difference at this scale.** The ~141 kB is dominated by the shared React + Next.js client runtime (hydration machinery, the router, RSC payload parsing) that ships on every page regardless of component count. The difference between shipping 3 dish cards' worth of JS versus 0 is a few kilobytes at most — too small to register against a ~140 kB framework floor.

This is a real and useful result, not a failed experiment: the server/client sort pays off as an application grows — more content, richer interactivity, heavier libraries — where the *avoided* client code becomes a meaningful fraction of the total. On a 3-dish demo it mostly buys architectural correctness (no fetching hook, no loading flag, data fetched where it lives) rather than a visible bundle win yet.

## A Real Bug Found Along the Way

Sorting the boundary surfaced an actual bug: the menu's sidebar (`app/menu/layout.js`) links to `/menu?category=ethiopian`, but `CategoryFilter`'s `useState` never read that query string — clicking a sidebar link changed the URL with no visible effect. Fixed by reading `searchParams` in the server page and passing it down as `CategoryFilter`'s initial state. The sidebar links and the in-page filter buttons are still two separate mechanisms — the buttons update only client state, not the URL — which is an intentional scope limit for this exercise, not something both were required to fully unify.

## Key Concepts Applied

- Server components are the default — no directive needed; they can be `async`, can read data directly, and ship zero JavaScript
- Client components need `"use client"`, can hold state and handlers, but cannot be `async`
- The directive marks a **boundary**, not a single file — everything imported beneath a `"use client"` file joins the client bundle, which is why it was pushed down to `CategoryFilter` and `AddToCartButton` specifically, not left on `page.js`
- Only serializable values (strings, numbers, arrays, plain objects) can cross from server to client as props — functions cannot, which is why `MenuPage` passes `dishes` as data rather than any callback
- `error.js` must be a client component because it needs state and a retry handler (`reset()`) — this is Next.js's own requirement, not a style choice

## Verified

- `npm run build` succeeds with the same route table as Day 37
- The server-rendered HTML (view source) contains the full dish list and prices already present — not injected later by JavaScript
- Exactly two files contain `"use client"` for genuinely interactive purposes (plus `error.js`, required by the framework)
- Sidebar category links now correctly filter the menu on load
