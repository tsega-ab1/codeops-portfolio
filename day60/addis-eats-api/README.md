# Addis Eats API

NestJS backend for Addis Eats (Module 4). Setup: `npm install`, copy `.env.example` to `.env`, then `npm run start:dev`.
Base URL: `http://localhost:3000/api/v1`
Checks: `bash run-all.sh` (Day 58 error behaviour) and `bash check-d59.sh` (Day 59), with the server running.

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

### Validation and errors (Day 58)
- Validate at the edge: bodies reject undeclared fields, queries strip them.
- A rule decidable from the request alone belongs in the DTO. A rule that needs the store or the current state belongs in the service, and usually answers 404, 409 or 422.
- The server prices every order. The client never sends a total.

### Cross-cutting behaviour lives in `src/common/` (Day 59)
| Concern | Stage | File |
|---|---|---|
| Request id on every request and response | middleware | `middleware/request-id.middleware.ts` |
| Who is calling (temporary API keys) | guard | `guards/api-key.guard.ts` |
| May they do this (`@Roles`) | guard | `guards/roles.guard.ts`, `decorators/roles.decorator.ts` |
| One log line per request, with duration | interceptor | `interceptors/logging.interceptor.ts` |
| Give up after 5 seconds (408) | interceptor | `interceptors/timeout.interceptor.ts` |
| Normalise an area name | pipe | `pipes/parse-area.pipe.ts` |

- **No handler contains any of this.** Everything is registered once in `app.module.ts` through `APP_GUARD` and `APP_INTERCEPTOR`, so the guards can use injected services.
- **No response envelope.** It would change every response and contradict the standard.
- **Guards run before pipes:** a caller who is about to be refused should not have their body parsed first.
- The API keys are scaffolding. In week 12 a JWT guard takes their place and `RolesGuard` does not change.
- The log line looks like `GET /api/v1/orders -> OrdersController.findAll ok 4ms [<request id>]` and is written by the interceptor, so requests refused by a guard (401, 403) or that match no route (404) do not get one.
