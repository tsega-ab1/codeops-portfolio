# Day 31 — React Router v6

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program. Week 7.

## What Today Covered

Addis Eats stops being one screen. Client-side routing, nested layouts, dynamic parameters, and protected routes — everything from Week 1 spread across real URLs.

## Route Table

| Path | Screen |
|---|---|
| `/` | Landing page with today's specials |
| `/menu` | The full menu with category filter |
| `/menu/:id` | One dish, with description and price |
| `/cart` | The current order and total in ETB |
| `/checkout` | Delivery details — signed in only |
| `*` | Not found |

## Key Concepts

### Routing Fundamentals
- A single-page application loads one HTML file and never reloads — React Router uses the History API to change the address bar without a request, then matches the new path against the routes
- Three components: `BrowserRouter` (provides routing context, goes once at the top), `Routes` (picks the single best match), `Route` (pairs a path with an element)
- Always include `path="*"` — without it, a mistyped URL renders a blank screen with no explanation
- `Link`/`NavLink` navigate without a reload; a plain `<a>` inside the app causes a full reload and wipes state — reserve plain anchors for external addresses

### Nested Routes & Layouts
- Most screens share a header, nav, and footer — nested routes let a parent render that frame once and drop the matching child into `<Outlet />`
- Navigating between nested children swaps only what's inside `Outlet` — the header is never rebuilt
- `index` routes match the parent's own path exactly; a child `path="menu"` (no leading slash) is relative to the parent; a leading slash makes it absolute and escapes the parent, silently breaking the nesting

### Dynamic Routes & Params
- A path segment starting with `:` is a parameter — one route (`menu/:id`) can serve every dish
- `useParams()` returns an object keyed by the names in the path; every value is a **string**, even if it looks like a number
- Putting the id into a `useFetch` URL puts it in that hook's dependency array, so navigating between dishes refetches automatically
- `useSearchParams` works like `useState` but the value lives in the query string — filters, sort order, and search terms become shareable and survive a refresh; keep cart contents and anything private out of the URL
- A valid path with an id that doesn't exist still matches the route — the component itself has to notice and show a "not found" message rather than crash

### Navigation & Protected Routes
- Use `Link` when the person chooses to go somewhere; `useNavigate` when the code decides (after a form submits, a payment clears); `Navigate` (the component) to redirect while rendering
- `navigate(path, { replace: true })` replaces the current history entry instead of adding one — stops the back button from returning to a checkout form or bouncing back to a rejecting page
- Calling `navigate` directly during render is a side effect; returning `<Navigate />` is an ordinary render that happens to change the URL
- A protected route waits for `loading` to finish before checking `user` — redirecting on a still-loading session throws a signed-in person back to login on every refresh
- Passing `state={{ from: location }}` to the redirect remembers where the person was headed, so login can send them back afterward

## Mini-Project: Addis Eats, Routed

- A nested route table with a `Layout` parent, an index route, and a `*` catch-all
- Navigation built from `Link` and `NavLink`, with the current screen visibly highlighted
- A dynamic `/menu/:id` route reading the parameter with `useParams`
- The category filter stored in the query string, so `/menu?category=Vegan` is shareable
- The cart provider mounted above the router so the order survives navigation
- A `RequireAuth` guard on `/checkout` that waits for loading and remembers the destination
- Every route verified by typing it directly into the address bar
