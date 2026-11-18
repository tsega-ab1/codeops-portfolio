# Addis Eats API standard

One page. The API follows it. When the two disagree, one of them is wrong and gets fixed.
**Version 1** - base URL `/api/v1`

## 1. Naming
- Plural nouns, lower case, hyphenated: `/restaurants`, `/order-items`. No verbs, no file extensions, no trailing slash.
- The id identifies and nothing else: `/orders/4821`.
- Nest only to show belonging, and never deeper than two levels: `/restaurants/1/dishes`, `/restaurants/1/orders`, `/restaurants/1/dishes/7`.
- A filter is never a path, it goes in the query string: `/orders?status=PENDING`, `/restaurants?isOpen=true`.
- One named sub-action is allowed on a member when a single field changes on its own under its own rules: `PATCH /orders/:id/status`.

## 2. Versioning
- **URI versioning.** Every route lives under `/api/v1`. The whole surface moves together, never one endpoint at a time.
- `/api/...` without a version is a **404**. A version is never sent as a query parameter.
- A new version is needed only for a breaking change: renaming or removing a response field, making an optional request field required, narrowing what a field accepts, or changing a status code for the same outcome. Adding an endpoint or an optional field is not breaking.
- Retiring a version (policy, not built yet): `Deprecation` and `Sunset` headers, months of overlap with both versions supported, then `410 Gone` with a link to the migration guide.

## 3. Methods
| Method | Used for | Safe | Idempotent | Success |
|---|---|---|---|---|
| GET | Read | yes | yes | 200 |
| POST | Create | no | no | 201 + `Location` |
| PATCH | Change part of a member (omitted fields are untouched) | no | not necessarily | 200 |
| DELETE | Remove | no | **yes** | 204 |

- PUT is not used: clients never hold the whole representation of a record.
- A GET never changes anything.
- **POST** answers `201` with `Location: /api/v1/<collection>/<new id>`. A failed POST has no `Location`.
- **DELETE is idempotent:** `204` with an empty body every time, including a repeat call and an id that never existed. A malformed id is still a `400`.
- **Creating an order** (`POST /orders`): the client sends the lines (`dishId` and `quantity`), never a total. The server prices the order from the dishes. The checks run in a fixed order: the restaurant exists, then the restaurant is open, then every dish is on that restaurant's menu, then the order is priced and saved.
- **Order status** may only move along these arrows. Anything else is a `409`.

| From | May become |
|---|---|
| PENDING | PREPARING, CANCELLED |
| PREPARING | ON_THE_WAY, CANCELLED |
| ON_THE_WAY | DELIVERED |
| DELIVERED | nothing (terminal) |
| CANCELLED | nothing (terminal) |

## 4. Responses
- **Collections:** `{ items, total, limit, offset }`, even when empty. `total` counts the rows that matched, before paging.
- **Members:** the object itself, with no wrapper.
- **Errors:** always **five fields**, whatever went wrong:

```json
{ "statusCode": 404, "message": "Order 99999 was not found",
  "path": "/api/v1/orders/99999", "timestamp": "2026-11-18T09:30:00.000Z", "requestId": null }
```
  - `message` is a string, or an array of strings for validation (one per broken rule, naming the field, for example `lines.0.dishId must be a positive number`).
  - `requestId` is the `x-request-id` request header, or `null` when the caller sent none (Day 59 adds a middleware that always sets it).
  - A stack trace never appears in any response. An unexpected failure is a `500` with the message `Internal server error`, and the detail goes to the server log only.
- **Money** is a whole number of santim (24000 = 240.00 ETB), never a decimal.

## 5. Validation and query controls
**At the edge:** a request body must contain only declared fields (an undeclared one is a `400` that names it). Query strings are more forgiving: an undeclared parameter is ignored. Every broken rule is reported at once, not only the first.

**Formats:** a TeleBirr number is `09xxxxxxxx` or `+2519xxxxxxxx`. A santim amount is a whole number from 1 to 10,000,000 (100,000 ETB). When `paymentMethod` is `TELEBIRR`, `phone` is required.

**Reserved names:** `limit`, `offset`, `sort`, `fields`, `q`, `after`. No resource may have a field with one of these names, so a filter can never collide with a control. (`after` is reserved for cursor paging and is not built yet.)

| Control | Form | Rule |
|---|---|---|
| `limit` | `?limit=10` | integer 1 to 50, default 20 |
| `offset` | `?offset=20` | integer 0 or more, default 0 |
| `sort` | `?sort=name`, `?sort=-totalSantim`, `?sort=area,-totalSantim` | a leading `-` means descending; several keys run left to right |
| `fields` | `?fields=id,status,totalSantim` | comma separated; the response keeps only these keys |
| `q` | `?q=abyssinia` | case-insensitive "contains" on `name` |
| equality | `?area=Bole` | the field name is the parameter name |
| several values | `?status=PENDING,PREPARING` | one key, comma separated (a repeated key also works) |

| Collection | Filters | Sort fields (default first) | `q` | `fields` |
|---|---|---|---|---|
| `/orders` and `/restaurants/:id/orders` | `status`, `area` | `id`, `customer`, `area`, `totalSantim` | no | yes |
| `/restaurants` | `area`, `isOpen` | `name`, `area` | yes | no |
| `/dishes` | `restaurantId` | `name`, `priceSantim` | yes | no |
| `/restaurants/:id/dishes` | none | `name`, `priceSantim` | yes | no |

- Order of work: filter, search, sort, page, then pick fields.
- A value that is not allowed (an unknown status, a sort field that does not exist, a field name that is not on the record) is a `400` that names the parameter.

## 6. Status codes
| Code | Used when | Example |
|---|---|---|
| 200 | A read or a PATCH worked | `GET /orders` |
| 201 | A POST created something (with `Location`) | `POST /orders` |
| 204 | A DELETE worked (always, empty body) | `DELETE /orders/6` |
| 400 | The request itself is wrong: a malformed id, a failed format rule, a cross-field rule, an undeclared field, a value that is not allowed | phone `0812345678` |
| 404 | The thing asked for is absent: an unknown id, an unknown parent, a `restaurantId` in a create body that matches nothing (existence outranks everything), or a path without `/v1` | `restaurantId: 99` |
| 409 | The request is fine but the current state refuses it | a closed restaurant, `DELIVERED` to `PENDING` |
| 422 | The request is valid but contradicts a relationship | a dish from another restaurant's menu |
| 500 | Our bug. Never on purpose | an unexpected error |

**How a domain error becomes a status** (the same table is in `src/common/filters/all-exceptions.filter.ts`):

| Domain error | Status |
|---|---|
| OrderNotFoundError, RestaurantNotFoundError, DishNotFoundError | 404 |
| InvalidTransitionError, RestaurantClosedError | 409 |
| DishNotOnMenuError | 422 |
| PaymentDeclinedError (defined, reachable from Day 61) | 402 |
| anything else | 500, generic message |

- **400, 404, 409, 422 in one line each:** 400 = fix the request. 404 = it is not there. 409 = the request was fine, the state said no. 422 = the request was fine, but it contradicts another record.
- Not used yet: 401 and 403 (week 12), 429 (Day 63).
