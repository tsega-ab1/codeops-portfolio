# Day 36 — Next.js: Intro & File-Based Routing

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program. Week 8.

## What Today Covered

The first day of Next.js. Nothing about React itself changes — components, props, state, hooks, effects are all the same. What changes is everything around them: routing comes from the folder structure instead of a route table, rendering starts on the server, and the loading/error boundaries written by hand on Day 34 become files with reserved names.

## Route Table

| Route | File | Type |
|---|---|---|
| `/` | `app/page.js` | Static |
| `/menu` | `app/menu/page.js` | Static |
| `/menu/[id]` | `app/menu/[id]/page.js` | Dynamic — server-rendered on demand |
| `/cart` | `app/cart/page.js` | Static |
| `/checkout` | `app/checkout/page.js` | Static |
| *(any unmatched path)* | `app/not-found.js` | Static |

Confirmed with `npm run build`, which lists exactly these routes and nothing extra — `DishList.jsx` and `CategoryBar.jsx`, colocated inside `app/menu/`, produce no route since neither is named `page.js`.

## Special Files Used

| File | What it does |
|---|---|
| `app/layout.js` | Root shell — header, nav (`next/link`), wraps every page |
| `app/menu/loading.js` | Shown automatically while the menu segment loads |
| `app/menu/error.js` | Shown if the menu segment throws — must be a client component (`"use client"`) since it needs state and a retry handler |
| `app/not-found.js` | Shown for any unmatched path, and also rendered when `/menu/[id]/page.js` calls `notFound()` for a dish id that doesn't exist |

## Key Concepts

- Next.js is a framework, not just a library — it wires up routing, data fetching, code splitting, image optimization, and SEO that would otherwise all be chosen and wired by hand (Vite + React Router + a custom `useFetch`, as in Days 26–34)
- Client-only rendering ships an empty `<div id="root">` — the real content only exists after JavaScript downloads and runs, which a slow connection and a crawler both suffer from. Server rendering sends complete HTML up front.
- `app/` is the entire router — there's no equivalent of the Day 31 `App.jsx` route table. A folder is a URL segment; `page.js` inside it is what makes it reachable.
- Only six file names are meaningful to the router: `page.js`, `layout.js`, `loading.js`, `error.js`, `not-found.js`, `route.js`. Everything else in `app/` is just a file — components can be colocated beside the route that uses them without becoming a URL.
- A dynamic segment (`[id]`) is read from a `params` prop, not a hook — this is what makes server rendering possible, since hooks don't exist there
- `next/link` replaces the anchor tag; `useRouter` from `next/navigation` replaces `useNavigate` — note the prop is `href`, not `to`
- Two kinds of "missing": an unmatched path renders the root `not-found.js` automatically; a valid path whose data doesn't exist is a deliberate call to `notFound()`
- The dev server (`npm run dev`) compiles on demand and is much slower than production — never judge performance or a rendering strategy from it; `npm run build` is the real picture

## Verified

- `npm run build` lists exactly the five expected routes plus `/_not-found`, and nothing extra
- `/menu/kitfo` works typed directly into the address bar
- `/menu/not-a-real-dish` triggers `notFound()` and renders `not-found.js`
- An unrelated bad URL also renders `not-found.js`
- Throttling the network reveals `loading.js` briefly on `/menu`
