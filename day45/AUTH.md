# Addis Eats Authentication

## Session

Sign-in checks phone + password (scrypt hash). On success the server sets a
signed token (HMAC-SHA256, 7 days) in the `session` cookie:

- `httpOnly` — page JavaScript cannot read it
- `secure` — HTTPS only in production
- `sameSite: lax` — limits cross-site sending
- never stored in `localStorage`

Sign-out deletes the cookie. Tokens are stateless, so a copied token stays
valid until it expires; a server-side session table would be the next step.

One helper, `getSession()` in `lib/session.js`, is used by pages, server
actions and route handlers.

## Layers

| Route / action | Middleware | Page | Query / action | What each layer proves |
| --- | --- | --- | --- | --- |
| `/` `/menu` `/menu/[id]` `/cart` | — | — | — | Public. Menu stays indexable. |
| `/signin` | — | redirects if already signed in | `safeNext` | Destination is same-site |
| `/checkout` | cookie exists | `getSession()` | `placeOrder`: session, server-side prices | Signed in; the write re-checks |
| `/orders` | cookie exists | `getSession()` | `getOrdersFor(session.id)` | Signed in; only own records |
| `/orders/[id]` | cookie exists | `getSession()` | `getOrderAs(user, id)` | Owner or staff, else 404 |
| `/kitchen` | cookie exists | `getSession()` + `role === "staff"` | `getKitchenOrdersAs` | Signed in and permitted |
| `placeOrder` | — | — | `createOrderAs`: session | Signed in |
| `cancelOrder` | — | — | `cancelOrderAs`: session, exists, owner, status | Owner only |
| `updateOrderStatus` | — | — | `setStatusAs`: session, staff, valid status | Staff only |
| `GET /api/orders/[id]/status` | — | — | session + `getOrderAs` | Owner or staff |
| `PATCH /api/orders/[id]/status` | — | — | `setStatusAs` | Staff only |
| `POST /api/orders/[id]/cancel` | — | — | `cancelOrderAs` | Owner only |

Middleware only proves a cookie exists. A forged cookie passes it and is
refused by `getSession()` (signature check).

## The three attacks

| Attack | Result | Line that refused it |
| --- | --- | --- |
| 1. Signed out cancels `ord_812` | 401 | `cancelOrderAs` in `lib/db.js`: `if (!user)` |
| 2. Dawit cancels Almaz's order | 403 | `cancelOrderAs`: `order.userId !== user.id` |
| 3. `/signin?next=https://example.com` | lands on `/` | `safeNext` in `lib/safe-redirect.mjs` |

Run `./attacks.sh` and paste the output below after your own run.

## Roles

`customer` and `staff`. The role comes from the user record behind the
verified session, never from the browser. Hiding the Kitchen link is only UI.
