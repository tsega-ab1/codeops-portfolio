# Rendering Strategy

## /
Static. The home page is purely static content.

## /menu
Server-rendered, cached with `use cache` + `cacheLife("hours")`.
The page fetches dish data directly on the server with no client
fetching hook.

## /menu/[id]
Prerendered dynamic route. `generateStaticParams()` provides the
known dish IDs, so each dish gets its own static HTML file at build
time. Calls `notFound()` for any unknown id, which renders the root
`not-found.js`.

## /cart
Client-side interactive UI. Cart state is genuinely user/browser-
specific, so it lives in a shared `CartContext` (client component),
persisted to `localStorage`. The page itself (`app/cart/page.js`)
stays a Server Component — only `CartClient.jsx` is client.

## /checkout
Server-side form mutation via a Server Action (`placeOrder` in
`app/actions.js`), using `useActionState` for validation feedback
and `useFormStatus` for the pending state.

## /orders
Static — reads the in-memory `orders` array populated by the
checkout Server Action.

## /api/dishes, /api/dishes/[id], /api/orders
Dynamic Route Handlers — real HTTP endpoints, tested directly with
curl independent of the UI. Exist because an external caller (not
just our own UI) might need them; the menu/dish pages themselves
fetch data directly via `getDishes()` rather than calling these.
