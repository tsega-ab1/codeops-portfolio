# Addis Eats API

NestJS backend for Addis Eats (Module 4). Run: `npm install`, then `npm run start:dev`.
Base URL: `http://localhost:3000/api/v1`
Check the error behaviour: `bash run-all.sh` (it reads `expected.md`).

The full rules are in [`docs/api-standard.md`](docs/api-standard.md). The route audit is in [`docs/api-audit.md`](docs/api-audit.md).

## Decisions

### Response shape (Day 56)
| What is returned | Shape | Why |
|---|---|---|
| A **collection** | `Page<T>` = `{ items, total, limit, offset }` | The same envelope even when there is no paging yet. Adding it later is a breaking change. |
| A **single member** | The bare object | Wrapping one record in `{ data: ... }` buys nothing. |
| An **error** | `{ statusCode, message, path, timestamp, requestId }` (Day 58) | Five fields on every failure, produced by one global filter, so a frontend writes one error handler. |

### Versioning (Day 57)
**URI versioning, `/api/v1`.** It is visible in the log, it is testable with `curl` or a browser, and it can be cached. The whole API moves together, and `/api/...` without a version is a 404.

### Query controls (Day 57)
Reserved names, never to be used as a field: **`limit`, `offset`, `sort`, `fields`, `q`, `after`**.
Sort uses a leading minus for descending (`?sort=-totalSantim`), and several values use commas (`?status=PENDING,PREPARING`).

### Validation and errors (Day 58)
- Validate at the edge: bodies reject undeclared fields, queries strip them.
- A rule decidable from the request alone belongs in the DTO (format, cross-field). A rule that needs the store or the current state belongs in the service, and usually answers 404, 409 or 422.
- The server prices every order. The client never sends a total.
