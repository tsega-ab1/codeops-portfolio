# API audit - Day 57

The Day 56 route surface (16 routes) checked against the nine naming rules.

## Result by rule
| # | Rule | Result |
|---|---|---|
| 1 | Nouns, never verbs | Pass. Every segment is a noun: orders, restaurants, dishes, status |
| 2 | Plural for collections | Pass |
| 3 | Lower case, hyphenated | Pass. Every segment is a single lower-case word |
| 4 | The id identifies, nothing else | Pass. Only `/orders/:id`, `/dishes/:id`, `/restaurants/:id` |
| 5 | Nest to show belonging | Pass. `/restaurants/:id/dishes` and `/restaurants/:id/orders` |
| 6 | No file extensions | Pass |
| 7 | No trailing slash | Pass. None is published |
| 8 | Filters go in the query | **Fail, twice.** `/restaurants/open` and `/orders/pending` |
| 9 | Two levels at most | Pass. The deepest is `/restaurants/:id/dishes/:dishId` |

## Renames (one sentence each)
1. `GET /restaurants/open` became `GET /restaurants?isOpen=true`, because "open" is a filter wearing a path, and in the query string it also combines with `?area=` and with paging for free.
2. `GET /orders/pending` became `GET /orders?status=PENDING`, because a path per status would need `/orders/delivered`, `/orders/cancelled` and a new route for every future status, while `?status=` handles all of them.

## Kept on purpose
- `PATCH /orders/:id/status` stays: it is a named part of one member that changes on its own, and the transition will have rules that a general PATCH would not enforce (Day 58).
- `GET /dishes?restaurantId=1` and `GET /restaurants/1/dishes` both stay: the first means "dishes in general, filtered", the second means "the dishes that only make sense inside one restaurant".

## Consequence
Both routes are gone, so `/api/v1/orders/pending` now falls through to `/api/v1/orders/:id`, and `ParseIntPipe` answers 400. The API is one row shorter per rename in the startup log.

# Authorisation audit - Day 62 homework, rechecked on Day 63

Every endpoint classified as **public**, **any login**, **role only** or **policy**. Nothing is left unclassified.
Checked against the decorators in the code, not from memory, and against `openapi.json`.

| Route | Who may call it | Gate | Rate limit |
|---|---|---|---|
| GET /health | anyone | public | none (a load balancer polls it) |
| POST /auth/register | anyone | public | 3 per hour per address |
| POST /auth/login | anyone | public | 5 per 15 minutes per address |
| POST /auth/refresh | a holder of a refresh token | public | 5 per 15 minutes per address |
| GET /auth/me | any login | token | default |
| GET /delivery-fees | anyone | public | default |
| GET /restaurants, GET /restaurants/:id | anyone | public | default |
| GET /dishes, GET /dishes/:id | anyone | public | default |
| GET /restaurants/:id/dishes, GET /restaurants/:id/dishes/:dishId | anyone | public | default |
| POST /restaurants | staff | **role only** | default |
| POST /dishes | staff, or the restaurant that owns the menu | **role**, then **policy** (MenuPolicy, Day 64) | default |
| POST /restaurants/:id/image | staff, or that restaurant's own user | **role**, then **policy** (MenuPolicy), then Multer's 2 MB limit | 30 per hour per address |
| POST /dishes/:id/image | staff, or the restaurant that owns the dish | **role**, then **policy** (MenuPolicy), then Multer's 2 MB limit | 30 per hour per address |
| GET /static/* | anyone | public, on purpose (menu images); UUID names, cached for a year | none |
| GET /orders | any login | token, and the **service filters** the list by OrderPolicy | default |
| GET /restaurants/:id/orders | any login | token, and the **service filters** the list by OrderPolicy | default |
| POST /orders | any login | token; the owner is taken from the token, never from the body | default |
| GET /orders/:id | the customer, the assigned courier, staff | **policy** `read` (404 for everyone else) | default |
| DELETE /orders/:id | staff; the owner while PENDING | **policy** `cancel` (403 once it cannot be cancelled) | default |
| PATCH /orders/:id/status | staff; the assigned courier | **role** courier or staff, then **policy** `updateStatus` | default |
| GET /debug/* | staff, development only | role only; the module is not mounted in production | default |

"Public" on the catalogue routes is on purpose: a menu is meant to be read by anyone. Public data is what a competitor would scrape,
so those routes are protected by rate limiting (Day 63), not by a login.

## What the audit found (and fixed on Day 63)
1. **POST /restaurants and POST /dishes needed only some login.** Any customer could add a restaurant or put a dish on a menu. They are now `@Roles("staff")`.
   The restaurant role should be able to add dishes to its *own* menu: that needs a `DishPolicy` and the user's `restaurantId`, which the token does not carry yet (homework).
2. **The OpenAPI spec did not mark GET /orders, POST /orders or GET /orders/:id as needing a token.** The routes were protected, but Swagger's Authorize button
   would not have sent the token for them. `@ApiBearerAuth` is now on the whole orders controller.

## Still open, on purpose
- The restaurant role has no order rights yet: it sees no orders and cannot change one. The rules table does not say what it should be able to do, which is a product question.
