# Day 40 — Next.js Foundations Project

Module 3 · Frontend: React & Next.js — consolidation of Days 36-39's
Addis Eats build into one complete application.

## Routes

| Route | Purpose |
|---|---|
| `/` | Home |
| `/menu` | Dish list, server-fetched |
| `/menu/[id]` | One dish, static via generateStaticParams |
| `/cart` | Client-side cart (Context + localStorage) |
| `/checkout` | Server Action form with validation |
| `/orders` | Placed orders |
| `/api/dishes`, `/api/dishes/[id]`, `/api/orders` | Route Handlers |

Full reasoning in `STRATEGY.md` and `BOUNDARY.md`.

## Verified

- `npm run build` succeeds, route table matches expectations
- `/menu/does-not-exist` renders the real `not-found.js` via `notFound()`
- Route Handlers tested directly with curl: 200/201/404/422 all confirmed
- Checkout validation (empty name, invalid phone) shows field errors correctly
- `loading.js` and `error.js` on the menu segment both exist and are wired correctly

## Known Issue — Cart

The cart was rebuilt today with a shared `CartContext` (localStorage-
persisted) so items added from any dish page show up correctly in
the header badge and the `/cart` page. Testing surfaced an
intermittent bug: in some sessions, an item is added to state
without its `id`, so it silently fails to resolve to a real dish on
the cart page even though the header count updates correctly.

Root cause not fully isolated yet — evidence points to either a
stale dev-server/cache artifact from mid-session file changes, or a
genuine timing issue in how `dishId` reaches `addItem`. Needs a
clean re-test (single incognito window, fresh `.next` build) to
confirm whether this reproduces in a true clean state. Logged here
rather than hidden, per the project's own principle of documenting
real decisions and real gaps.
