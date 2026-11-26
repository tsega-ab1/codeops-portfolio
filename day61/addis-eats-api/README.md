# Addis Eats API

NestJS backend for Addis Eats (Module 4). Setup: `npm install`, copy `.env.example` to `.env`, fill in `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and `SEED_PASSWORD` (see Day 61), then `npm run start:dev`.
Base URL: `http://localhost:3000/api/v1`
Checks: `bash run-all.sh` (Day 58), `bash check-d59.sh`, `bash check-logs.sh` and `bash check-d60.sh`, and `bash check-d61.sh` (Day 61), with the server running.

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
| Who is calling (Day 61: the JWT) | guard | `auth/guards/jwt-auth.guard.ts` |
| May they do this (`@Roles`) | guard | `guards/roles.guard.ts`, `decorators/roles.decorator.ts` |
| One log line per request, with duration | interceptor | `interceptors/logging.interceptor.ts` |
| Give up after 5 seconds (408) | interceptor | `interceptors/timeout.interceptor.ts` |
| Normalise an area name | pipe | `pipes/parse-area.pipe.ts` |

- **No handler contains any of this.** Everything is registered once in `app.module.ts` through `APP_GUARD` and `APP_INTERCEPTOR`, so the guards can use injected services.
- **No response envelope.** It would change every response and contradict the standard.
- **Guards run before pipes:** a caller who is about to be refused should not have their body parsed first.
- The Day 59 API keys were scaffolding: on Day 61 a JWT guard took their place and `RolesGuard` did not change.
- The log line looks like `GET /api/v1/orders -> OrdersController.findAll ok 4ms [<request id>]` and is written by the interceptor, so requests refused by a guard (401, 403) or that match no route (404) do not get one.

### Logs and documentation (Day 60)
- **Structured JSON logs on stdout** (pino). The level is `LOG_LEVEL` in `.env`. `NODE_ENV=development` switches to readable output; or pipe: `npm run start:dev | npx pino-pretty`.
- **One request, one story:** every line carries `requestId`. Read a single request with `grep '"requestId":"<id>"' server.log`.
- **Redaction lives in `src/config/logger.config.ts`**, in one list, not at forty call sites.
- **Swagger at `/docs`** (not in production), raw spec at `/docs-json`, `openapi.json` committed. Regenerate it with `npm run export:openapi` after any change to the API.
- Checks: `bash check-logs.sh` (needs `npm run build`) and `bash check-d60.sh` (with the dev server running).

### Authentication (Day 61)
Who is calling is now a **real user with a token**, not a hard-coded key. `req.user` is `{ id, email, roles }`, put there by `JwtStrategy.validate`, and everything else reads that object.

| Route | Who | What it does |
|---|---|---|
| `POST /api/v1/auth/register` | anyone | Creates a `customer` account. 201, and the answer never contains the password or its hash. |
| `POST /api/v1/auth/login` | anyone | 200 and `{ accessToken, refreshToken, tokenType, expiresIn }`. 200, not 201: nothing is created. |
| `POST /api/v1/auth/refresh` | a refresh-token holder | Trades a refresh token for a **new pair**. The old refresh token is dead the moment it is used. |
| `GET /api/v1/auth/me` | any login | The caller's own `id`, `email` and `roles`. |

**Setup.** `.env` needs `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (two *different* values, at least 32 characters each; the app refuses to start otherwise) and `SEED_PASSWORD` (at least 10 characters). Outside production, development users are created at startup with that password. Generate a secret with `node -p "require('crypto').randomBytes(48).toString('hex')"`.

**Decisions**
- **Protected by default.** `JwtAuthGuard` is global, and `@Public()` is the escape hatch. A new route is private until somebody decides otherwise.
- **Passwords: argon2**, one salt per user, minimum 10 characters.
- **One message for both login failures.** An unknown email and a wrong password give the identical 401, and login verifies against a throwaway hash when the email is unknown, so timing does not give the account away either.
- **Two secrets, two lifetimes.** Access token 15 minutes, refresh token 7 days (`JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`). Different secrets mean a refresh token cannot be presented as an access token, or the other way round.
- **The refresh token is stored hashed and rotated.** Reusing an old one is a 401.
- **A token is a snapshot.** The roles in it are the roles at the moment of login, so a demotion takes effect when the access token expires: up to 15 minutes.
- **Bad credentials are 401, not 403** (a forged, expired or missing token). 403 is for a *known* caller who is not allowed.
- The Day 59 API-key guard is gone. `RolesGuard` did not change: it simply started reading a real `req.user`.

Check: `bash check-d61.sh` with the server running (the older check scripts now log in as the dev users).
