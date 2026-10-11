# AUTH.md — Addis Eats Day 42

## How it works
1. `POST /api/signin` verifies email + password against `lib/users.js`.
2. The server sets an `httpOnly`, `sameSite=lax` cookie (`secure` in production)
   whose value is `<userId>.<HMAC signature>`.
3. `getSession()` (`lib/session.js`) is the single helper that reads and
   verifies the cookie, then loads the user and role from the server-side user
   record. Role is never read from the cookie.
4. `POST /api/signout` deletes the cookie.

## Three protection layers
| Layer | What it proves |
|---|---|
| Proxy (`proxy.js`) | A cookie named `session` exists. Nothing more. |
| Page / layout | `getSession()` verifies the signature and finds the user. |
| Server Action / Route Handler | The user is authenticated AND allowed to do this operation (ownership, role). |

## Route / action protection map
| Route / action | Protection |
|---|---|
| `/`, `/menu`, `/menu/[id]` | Public |
| `/signin` | Public; `next` validated by `safeNext()` |
| `/checkout` | Proxy + `getSession()` check in page |
| `/orders` | Proxy + `getSession()` + `getOrdersFor(session.userId)` |
| `placeOrder` | `getSession()` check inside the action; user id from session |
| `cancelOrder` | `getSession()` + order exists + `order.userId === session.userId` + status check |
| `/kitchen` | Proxy + `getSession()` + `role === "staff"` |
| `POST /api/signin` | Credential check, 303 redirect, safe `next` |
| `POST /api/signout` | Deletes the cookie |

## Security tests (all expected results observed)
1. Signed out -> `/orders` redirects to `/signin?next=/orders`.
2. Signed out -> cancel action fails with "Not signed in".
3. Abebe tries to cancel Marta's `1002` -> "You are not allowed to cancel this order".
4. Customer opens `/kitchen` -> "Forbidden".
5. Staff opens `/kitchen` -> Kitchen page with all orders.
6. `/signin?next=https://example.com` and `?next=//example.com` -> redirect to `/`, never off-site.
7. Cookie edited to `demo-staff-1` without a valid signature -> treated as signed out.

## Known limitations (learning implementation)
- Passwords are plain text in `lib/users.js`; real apps store Argon2/bcrypt hashes.
- Sessions are not revocable server-side (no session table); signing out only clears the browser cookie.
- Orders and users are in memory and reset when the server restarts.
- No CSRF tokens, rate limiting, password reset, or OAuth.
- For a real product, use a mature library (Auth.js / Better Auth) instead of this hand-rolled code.

## Order-by-id protection (added after review)
| Route | Protection |
|---|---|
| `/orders/[id]` | Proxy + `getSession()` + `canViewOrder()` (owner or staff); missing and not-yours both show "Order not found" |
| `GET /api/orders/[id]` | Not covered by Proxy; handler returns 401 without a session and 404 for missing or not-yours orders |
| `placeOrder` | `getSession()` first; owner = `session.userId`; dish and price validated against a server-side menu |

Earlier days' `/orders/[id]` and `/api/orders/[id]` had no auth at all: any visitor could read any order by guessing an id.
