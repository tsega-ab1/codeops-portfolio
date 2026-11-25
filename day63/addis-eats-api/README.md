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

### Logs and documentation (Day 60)
- **Structured JSON logs on stdout** (pino). The level is `LOG_LEVEL` in `.env`. `NODE_ENV=development` switches to readable output; or pipe: `npm run start:dev | npx pino-pretty`.
- **One request, one story:** every line carries `requestId`. Read a single request with `grep '"requestId":"<id>"' server.log`.
- **Redaction lives in `src/config/logger.config.ts`**, in one list, not at forty call sites.
- **Swagger at `/docs`** (not in production), raw spec at `/docs-json`, `openapi.json` committed. Regenerate it with `npm run export:openapi` after any change to the API.
- Checks: `bash check-logs.sh` (needs `npm run build`) and `bash check-d60.sh` (with the dev server running).

---

## Day 63 — API Security: Harden and Attack

This day applies the OWASP API Security Top 10 to Addis Eats, adds transport, request-volume and input protections, and verifies them by attacking the API locally. The ten attacks and their observed results are recorded in [`SECURITY.md`](SECURITY.md).

### Security controls

| Area | Implementation |
|---|---|
| Security headers | `helmet` removes `X-Powered-By` and sets security headers, including HSTS, `X-Content-Type-Options`, CSP and frame protection. The API uses a restrictive CSP; Swagger has a separate policy in development. |
| CORS | Exact origins are read from `CORS_ORIGINS`. Wildcards, paths and trailing slashes are rejected at startup. Credentials are disabled; allowed methods and headers are explicitly listed. |
| Global rate limit | `@nestjs/throttler` applies a configurable per-address, per-route limit. Default: `THROTTLE_LIMIT=600` requests per minute. |
| Sensitive routes | Login and refresh default to 5 attempts per 15 minutes; registration defaults to 3 per hour. Configure with `THROTTLE_STRICT_LIMIT` and `THROTTLE_REGISTER_LIMIT`. |
| Health check | `GET /api/v1/health` is public and uses `@SkipThrottle()` so monitoring is not blocked by the general limit. |
| Rate-limit response | A throttled request receives HTTP 429, a `Retry-After` header and the standard five-field error response with its request ID. |
| Request size | JSON and URL-encoded bodies are limited to 100 KB. Oversized bodies return 413; malformed JSON returns 400. |
| Mass assignment | Write DTOs reject undeclared properties with `forbidNonWhitelisted`. Create services explicitly assign allowed fields rather than spreading request objects into records. |
| Input constraints | Names are validated against a character and length rule. The API stores accepted text as data; HTML output encoding belongs to the frontend and its rendering context. |
| Error disclosure | Unexpected errors return a generic 500 message. Internal stack traces are logged server-side, not sent to clients. |
| Production inventory | Swagger and the debug module are not mounted in production. |

**Global-limit note:** the teaching slide specifies 300 requests per minute. This implementation uses 600 because the module's acceptance check requires 400 restaurant reads in one minute to remain successful. The actual setting is configurable through `THROTTLE_LIMIT`.

### Configure and run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the environment file:

   ```bash
   cp .env.example .env
   ```

3. Set two different JWT secrets, each at least 32 characters, and set `SEED_PASSWORD` to a password of at least 10 characters for the development accounts. Generate secrets with:

   ```bash
   node -p "require('crypto').randomBytes(48).toString('hex')"
   ```

4. Start the API:

   ```bash
   npm run start:dev
   ```

The API runs at `http://localhost:3000/api/v1`. Swagger is available at `http://localhost:3000/docs` outside production.

### Run the ten attacks

Run the exercise only against your own local API:

```bash
bash attack.sh
```

The script builds the application and starts three local API instances:

- **A — port 3057:** real rate limits, used for the brute-force and volume checks.
- **B — port 3058:** relaxed login and registration limits, used by the other tests.
- **C — port 3059:** production mode, used to verify that Swagger and debug routes are absent.

To write the observed results into `SECURITY.md`:

```bash
bash attack.sh --write
```

The script checks the ten attacks from the module:

| # | Attack | Expected result |
|---|---|---|
| 1 | Enumerate `GET /orders/1..500` using a customer's token | The customer's own orders may return 200; another customer's orders return 404. |
| 2 | Register with `"roles": ["staff"]` | 400; the undeclared `roles` property is rejected. |
| 3 | Submit six wrong login attempts | The sixth attempt is rate-limited with 429 and `Retry-After`. |
| 4 | Submit a 5 MB JSON body | 413; request refused. |
| 5 | Try to delete an order as a customer who may not cancel it | 403. |
| 6 | Request a protected route without credentials | 401. |
| 7 | Use an expired access token | 401. |
| 8 | Request `/docs` in production | 404. |
| 9 | Send a CORS preflight from an unapproved origin | No `Access-Control-Allow-Origin` permission is returned. |
| 10 | Trigger an unexpected server error | Generic 500 response; no stack trace or internal detail in the response. |

The script also performs extra checks for security headers, the general request limit, the health-check exemption, unsafe name input, malformed JSON and attempts to set a dish ID.

**Important:** read the actual output and keep `SECURITY.md` honest. A result should be marked as passed only when the script observed the expected behaviour.

### OWASP API Security Top 10 — current position

| Item | Risk | Position in this project |
|---|---|---|
| API1 | Broken object-level authorisation | Closed by Day 62 order policies; hidden orders return 404. |
| API2 | Broken authentication | Closed by Day 61 authentication; missing and expired tokens return 401. |
| API3 | Broken object property authorisation | Closed for current write paths by strict DTO validation and explicit field assignment. |
| API4 | Unrestricted resource consumption | Limited by request-size and rate controls; counters are currently in memory. |
| API5 | Broken function-level authorisation | Closed by Day 62 role and policy checks. |
| API6 | Unrestricted access to sensitive flows | Login, refresh and registration have stricter rate limits. |
| API7 | Server-side request forgery | Not applicable yet; the API does not make outbound requests. |
| API8 | Security misconfiguration | Today's scope is addressed by Helmet, explicit CORS, generic errors and production route restrictions. |
| API9 | Improper inventory management | Versioned routes and generated Swagger help; production omits Swagger and debug routes. |
| API10 | Unsafe consumption of third-party APIs | Not applicable yet; third-party API consumption comes in later days. |

### Known limitations

- Rate-limit counters are in memory, so separate API instances do not share one limit. A shared store such as Redis is needed for a multi-instance deployment.
- Behind a reverse proxy, configure trusted proxy handling only when the proxy is controlled and correctly configured; otherwise client IP-based limits can be inaccurate.
- This local project does not terminate HTTPS. Production must use TLS; HSTS is a browser instruction and does not replace HTTPS.
- Rate limits are one layer of defence and do not stop a distributed attacker using many source addresses.

