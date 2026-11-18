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
- **DELETE is idempotent:** `204` with an empty body every time, including a repeat call and an id that never existed, because the caller's intent is already satisfied. A malformed id is still a `400`.

## 4. Responses
- **Collections:** `{ items, total, limit, offset }`, even when empty. `total` counts the rows that matched, before paging.
- **Members:** the object itself, with no wrapper.
- **Errors:** `{ statusCode, error, message }`. `message` is a string, or an array of strings for validation. `path` and `requestId` are added on Day 58.
- **Money** is a whole number of santim (24000 = 240.00 ETB), never a decimal.

## 5. Query controls
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
| Code | Used when |
|---|---|
| 200 | A read or a PATCH worked |
| 201 | A POST created something (with `Location`) |
| 204 | A DELETE worked (always, empty body) |
| 400 | The request is invalid: a malformed id, a failed validation rule, a value that is not allowed, or a body that points at a `restaurantId` that does not exist |
| 404 | The thing asked for is absent: unknown id, unknown parent (`/restaurants/99/orders`), or a path without `/v1` |
| 500 | Our bug. Never on purpose |

- **400, not 422,** for every validation failure, so there is one code for "fix your request".
- Not used yet: 401 and 403 (week 12), 409 and 422 (business rules, Day 58), 429 (Day 63).
