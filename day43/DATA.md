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

## Take-Home: Search with Category Filtering

1. **What data is fetched?** Dishes filtered by a search term and a category.
2. **Why client-side?** Both inputs change as the user interacts, so the browser must request new results without a page reload.
3. **Query key?** `/api/dishes?q={term}&category={category}`. Both values are part of the key, so each combination is its own cache entry.
4. **How long fresh?** The menu rarely changes, so a few minutes is reasonable (SWR revalidates on focus by default; TanStack's menu query uses `staleTime: 5 min`).
5. **What triggers revalidation?** Changing the debounced search term or the category (key change), plus window refocus.
6. **After a mutation?** Adding to the cart invalidates `["cart"]`, so the cart count refetches immediately.
7. **Initial server data?** Not for this screen. It starts from the empty-search state and fetches client-side, because the filters are browser-controlled.

## TanStack Query Staleness Choices

- `["dishes"]`: `staleTime` 5 minutes (menu rarely changes)
- `["cart"]`: `staleTime` 0 (changes on every add, must always refetch on invalidation)
