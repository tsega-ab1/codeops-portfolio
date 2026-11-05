# Day 51 – Tracing a Real API (Addis Eats)

**Course:** CodeOps · Module 4 – Backend Fundamentals
**Date:** 5 November 2026
**What I traced:** my Module 3 Addis Eats frontend (`https://codeops-portfolio-alpha.vercel.app`) using Chrome DevTools (F12 → Network → Fetch/XHR).
**Note:** Secrets are masked. The session cookie, phone number and password are not recorded here.

---

## 1. How I did it

1. Opened the site, pressed **F12**, opened the **Network** tab and filtered by **Fetch/XHR**.
2. Used the site normally (browse menu, open a dish, open cart, sign in, place an order).
3. For each new row, I read **Headers** (method, URL, status), **Payload** (request body) and **Response**.

> The app is built with Next.js. Many requests have `?_rsc=...` in the URL. That is Next.js fetching page data in the background. It is not a search filter. These responses use the format `text/x-component`, not JSON.

---

## 2. Six requests

| # | What I did | Method | Full path | Status | Request body? |
|---|---|---|---|---|---|
| 1 | Clicked **Browse menu** | GET | `/menu?_rsc=1p-R_iEY6bj0jY31` | 200 OK | No |
| 2 | Opened the **Shiro** dish | GET | `/menu/shiro?_rsc=VQ-9zuLWYPaFurNS` | 200 OK | No |
| 3 | Clicked **Cart** | GET | `/cart?_rsc=_SehEFaIFpq0PoXe` | 200 OK | No |
| 4 | Submitted the **sign-in** form | POST | `/signin` | 303 See Other | Yes (form data) |
| 5 | Clicked **Place order** | POST | `/checkout` | 200 OK | Yes |
| 6 | Order page asked for the order status | GET | `/api/orders/ord_813/status` | 404 Not Found | No |

### Details

**#1 GET /menu** – No body, because a GET puts its data in the URL. The response is the Next.js page data for the menu (a "Loading menu…" placeholder plus page metadata).

**#2 GET /menu/shiro** – The path identifies one resource (`shiro`). The page data contains the dish name, description and price (220 ETB).

**#3 GET /cart** – Same pattern: no body, 200, page data for the cart.

**#4 POST /signin** – Sends the login form. Body (field names only):

| Field | Value |
|---|---|
| `_1_phone` | `09XXXXXXXX` (masked) |
| `_1_password` | `********` (masked) |
| `_1_next` | `/` (where to go after sign-in) |
| `0` | internal Next.js value |

The format is `multipart/form-data`, which is what a normal browser form sends. It is a POST, not a GET, because a password must never appear in a URL. URLs end up in browser history and server logs. The 303 means "your form was accepted, now go to another page".

**#5 POST /checkout** – Body:

```
[[{ id: "shiro", qty: 1 }], "<uuid, shortened: df23d186-…>"]
```

It contains the list of items (dish id and quantity) and a unique id string. The response contains `{"ok":true,"orderId":"ord_813"}`, which is how the page learns which order to open next.

**#6 GET /api/orders/ord_813/status** – No body. Response body:

```json
{"error":"Not found"}
```

This is the failing request (see section 5).

### Other requests I saw
- `GET /orders?_rsc=...` and `GET /orders/ord_813?_rsc=...` – 200, loading the orders pages.
- `GET /api/orders/ord_813/stream` – 404, type `eventsource` (a long-lived connection for live updates).

---

## 3. Headers

I picked the two POST requests, because they show the most.

### Request A – `POST /checkout` (status 200)

**Request headers**

| Header | Value | What it does |
|---|---|---|
| `accept` | `text/x-component` | Tells the server which format the client wants back (React's streaming format, not JSON). |
| `content-type` | `text/plain;charset=UTF-8` | Describes the body that is being sent. |
| `next-action` | `6017fc0b…` (shortened) | An ID that tells Next.js which server function to run. This is why the POST goes to `/checkout` and not to an `/api/...` route. |

**Response headers**

| Header | Value | What it does |
|---|---|---|
| `content-type` | `text/x-component` | Format of the answer. It matches what `accept` asked for. |
| `cache-control` | `no-cache, no-store, max-age=0, must-revalidate` | Forbids saving the response, which makes sense for a request that creates an order. |
| `content-encoding` | `br` | The body is compressed with Brotli so it is smaller and faster to send. |

### Request B – `POST /signin`

**Request headers**

| Header | Value | What it does |
|---|---|---|
| `content-type` | `multipart/form-data; boundary=----WebKitFormBoundary…` | Says the body is a browser form. The `boundary` separates the fields. |
| `content-length` | `450` | Size of the body in bytes. |
| `next-action` | `603bbe9d…` (shortened) | Tells Next.js which server function handles the sign-in. It is a different ID from the checkout one. |

**Response headers**

| Header | Value | What it does |
|---|---|---|
| `set-cookie` | `session=*****; Path=/; Max-Age=604800; Secure; HttpOnly; SameSite=lax` | Gives the browser a session token. Value masked. |
| `x-action-redirect` | `/;push` | Tells the app to navigate to `/` after the action. |
| `cache-control` | `private, no-cache, no-store, max-age=0, must-revalidate` | Forbids storing the response, which matters because it carries a login token. |

**What `set-cookie` shows:** `Max-Age=604800` is 7 days. `HttpOnly` means JavaScript on the page cannot read the cookie. `Secure` means it is only sent over https. HTTP forgets everything between requests, so the browser sends this cookie back with every later request. That is how the server knows who I am.

---

## 4. Status code notes

- **200 vs 201 on `POST /checkout`.** This request creates an order, so a more precise answer would be **201 Created**. It returns **200**. The body does confirm success (`"ok": true`), and it is a framework-controlled server action, so I think 200 is acceptable here, but in an API I design myself I would return 201.
- **303 on `POST /signin`.** 303 See Other is correct after a form POST. It tells the browser to load a different page with a GET, so refreshing does not resend the password.

---

## 5. Failing request

- **Request:** `GET /api/orders/ord_813/status`
- **Status:** 404 Not Found
- **Response body:** `{"error":"Not found"}`
- **How I found it:** it appeared in the Network tab by itself after placing an order. `/api/orders/ord_813/stream` failed the same way.

**Is 404 the right kind of code? Yes.**
- A 404 is a 4xx, meaning the caller asked for something the server does not have. The server is working, so a 5xx would be wrong.
- It is not an authentication problem, so 401 and 403 do not fit.
- The body is also consistent with the status (`"error"`), which is what the slides ask for.

**But the answer is wrong for this order.** I had just placed `ord_813`, and the order page opened it successfully, so the order does exist. The status endpoint should have answered 200 with the status. Things I would check in the backend:
- The status endpoint may look orders up somewhere different from where checkout saves them (for example, data kept in memory on a serverless host, where two requests can reach two different instances).
- The session may not match the order's owner. An API can answer 404 instead of 403 on purpose, so it does not reveal that someone else's order exists.

I have not confirmed which of these it is.

**The client has a second problem.** The page tries `/stream` first, and when that fails it falls back to polling `/status`. Both return 404, but the page keeps retrying, so red rows keep appearing. A 404 will not fix itself, so the client should stop after a few attempts and show a message.

---

## 6. Endpoint table for the Addis Eats API I will build

| Method | Path | Purpose | Success status | Why this status |
|---|---|---|---|---|
| GET | `/api/v1/dishes` | List all dishes | 200 | Reading, nothing created |
| GET | `/api/v1/dishes/{id}` | Get one dish | 200 | Reading one resource |
| POST | `/api/v1/auth/signin` | Sign in with phone and password | 200 | Credentials checked, session started; nothing new is created as a resource |
| POST | `/api/v1/orders` | Place a new order | 201 | A new order was created |
| GET | `/api/v1/orders/{id}/status` | Get the status of an order | 200 | Reading; this is the endpoint the order page expects |
| DELETE | `/api/v1/orders/{id}` | Cancel an order | 204 | Done, nothing to return in the body |

---

## 7. What I learned

- A request has four parts: **method, path, headers, body**. A response has **status, headers, body**.
- GET carries its data in the URL; POST carries it in the body.
- The status code is the answer: 2xx worked, 3xx go somewhere else (like the 303 after sign-in), 4xx the caller was wrong, 5xx the server was wrong.
- A server answers and forgets, so a cookie is how it recognizes me across requests.

---

## 8. Screenshots

Network tab captures (Headers and Payload) for each request are in [`screenshots/`](screenshots/):

| # | File |
|---|---|
| 1 | `screenshots/01-get-menu.png` |
| 2 | `screenshots/02-get-dish-shiro.png` |
| 3 | `screenshots/03-get-cart.png` |
| 4 | `screenshots/04-post-signin.png` |
| 5 | `screenshots/05-post-checkout.png` |
| 6 | `screenshots/06-get-status-404.png` |
| 7 | `screenshots/07-signin-headers.png` |
| 8 | `screenshots/08-checkout-headers.png` |
