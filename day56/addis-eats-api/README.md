# Addis Eats API

NestJS backend for Addis Eats (Module 4). Run: `npm install`, then `npm run start:dev`.
Base URL: `http://localhost:3000/api`

## Response shape decision (Day 56)

Decided once, followed by every endpoint from now on:

| What is returned | Shape | Why |
|---|---|---|
| A **collection** (any list) | `Page<T>` = `{ items, total, limit, offset }` | The same envelope even when there is no paging yet. Adding it later is a breaking change. |
| A **single member** | The bare object, e.g. `{ "id": 1, ... }` | Wrapping one record in `{ data: ... }` buys nothing. |
| An **error** | `{ statusCode, error, message }` | This is the shape Nest's built-in filter already produces, so we do not invent a second one. |

- `total` is the number of rows that **matched**, counted before paging. It is what a pager needs.
- Paging order inside every service: **filter, then sort, then page**.
- `limit` defaults to 20 and is capped at 50 (`@Max(50)`); `offset` defaults to 0.
- A **DELETE** that works answers `204` with no body at all.
- A child collection (`/restaurants/:id/orders`) validates the parent first: a restaurant that does not exist is a `404`, never an empty page.
