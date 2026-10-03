# Addis Eats Data Strategy

## Menu (initial)
Key: none (server-rendered)
Strategy: Server Component reads `lib/dishes.js` directly.
Reason: The initial menu doesn't need browser-side fetching.

## Menu Search
Key: `/api/dishes?q={term}`
Strategy: SWR + 300ms debounce + `keepPreviousData`.
Reason: The request depends on user typing; previous results stay visible while new ones load, and a request isn't fired on every keystroke.

## Menu Pagination
Key: `/api/dishes?page={page}`
Strategy: SWR + `keepPreviousData`.
Reason: The page number is browser-controlled state and belongs in the cache key so each page is its own cache entry.

## Order Status
Key: `/api/orders/{id}`
Strategy: SWR + `fallbackData` (server-provided initial order) + `refreshInterval: 5000`.
Reason: Order status changes while the page is open; `fallbackData` avoids an empty loading flash on first render.

## Cart
Key: `/api/cart`
Strategy: SWR, refreshed via `mutate()` after a successful POST.
Reason: The client cache must reflect the latest cart state immediately after a write.

## Add to Cart (TanStack Query demo)
Mutation: `useMutation` wrapping `addToCart()`.
On success: `queryClient.invalidateQueries({ queryKey: ["cart"] })`.
Reason: Demonstrates the TanStack Query mutation + invalidation pattern as an alternative to SWR's `mutate()`.
