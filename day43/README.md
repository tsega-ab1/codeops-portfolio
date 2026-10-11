# Day 41 — Data Fetching with SWR and TanStack Query

Module 3 · Frontend: React & Next.js — CodeOps Full Stack Software Development.

## What Today Covered

The question shifts from "which hook fetches this?" to "does this data need to be fetched in the browser at all?" Server Components handle data with no interaction; SWR and TanStack Query handle data that genuinely needs client-side caching, revalidation, polling, search, or pagination.

## What Was Built

- **Home (`/`)** — Server Component, reads dish data directly, zero client JS for this data
- **Menu search** — `SearchBox.js`, SWR + a custom `useDebounce` hook (300ms) + `keepPreviousData`, so typing doesn't fire a request per keystroke and old results don't flash empty between searches
- **Pagination** — `PaginatedMenu.js`, the page number lives in both the URL-style key (`/api/dishes?page=N`) and component state, so each page is its own SWR cache entry
- **Order status (`/orders/[id]`)** — server fetches the initial order and passes it to the client as `fallbackData`, so the page shows real data immediately with no loading flash, then SWR polls `refreshInterval: 5000` to keep it current
- **Cart** — SWR + `mutate()` after a POST to refresh the cached list
- **TanStack Query** — set up via a `Providers` client component wrapping `QueryClientProvider`; `AddToCartButton.js` demonstrates `useMutation` + `invalidateQueries(["cart"])` as the TanStack equivalent of SWR's `mutate()`

Full reasoning per feature in `DATA.md`.

## Key Concepts

- **SWR key** — identifies cached data; same key across components = same cache entry; `null` key = don't fetch yet
- **TanStack queryKey** — the structured equivalent, e.g. `["dishes", page]`; enables targeted invalidation
- **staleTime vs gcTime** — staleTime answers "how long is this still fresh," gcTime answers "how long does unused cached data stick around before being garbage collected" — different questions entirely
- **fallbackData / initialData** — seeds a client hook with server-fetched data so the first render isn't an empty loading state
- **Race conditions** — a slower, earlier request (e.g. "tib") could resolve after a faster, later one (e.g. "tibs") and incorrectly overwrite the screen; SWR and TanStack Query both coordinate this automatically
- **Next.js 16 dynamic params are async** — `const { id } = await params;`, not the older direct-access pattern

## Verified

- Network tab confirms the search box does **not** fire a request per keystroke — only after a 300ms pause
- Network tab confirms `/api/orders/1001` refires roughly every 5 seconds while the page is open
- `page=1` and `page=2` produce distinct requests and distinct SWR cache entries
- Adding "Special Tibs" to the cart updates the list without a manual page reload
