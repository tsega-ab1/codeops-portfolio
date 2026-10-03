# Server / Client Boundary

## RootLayout
Server Component. Provides shared structure and metadata; wraps
children in `Providers` rather than being client itself.

## Providers
Client Component. Required because `CartProvider` holds state.

## Header
Server Component. Renders static nav links plus the `CartBadge`
client leaf — kept server wherever possible.

## CartBadge
Client Component. Reads live cart count via `useCart()`.

## MenuPage
Server Component. Fetches dish data directly with `await getDishes()`.

## DishPage (/menu/[id])
Server Component. Reads the route param, fetches the one dish,
renders the `AddToCartButton` client leaf.

## AddToCartButton
Client Component. Needs `onClick` and `useCart()`.

## CartClient
Client Component. Holds/reads cart state and quantity controls.

## Loading (menu)
Server Component. Pure static skeleton markup.

## Error (menu)
Client Component. Required by Next.js — needs `reset()` via a button.

## CheckoutPage / CheckoutForm
Client Component (`checkout-form.jsx`) using `useActionState`, with
a separate `SubmitButton` client leaf using `useFormStatus`.

## OrdersPage
Server Component. Reads the in-memory orders array directly.
