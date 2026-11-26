# Addis Eats API

NestJS backend for Addis Eats (Module 4). Setup: `npm install`, copy `.env.example` to `.env`, fill in `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and `SEED_PASSWORD` (see Day 61), then `npm run start:dev`.
Base URL: `http://localhost:3000/api/v1`
Checks: `bash attack.sh` (the Day 63 attack list; starts its own servers), `npm test`, and with `npm run start:dev:relaxed` running `bash check-d62.sh`, `bash check-d61.sh`, `bash check-d59.sh`, `bash run-all.sh` and `bash check-d60.sh`.

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

### Authorisation (Day 62)
Authentication answered *who are you*. Authorisation answers *may you do this*, and that depends on three things: what the caller **is** (a role), what they **own** (the order), and what **state** it is in. A role handles the first; only the order itself can settle the other two.

**Roles** are an array on the user (`customer`, `courier`, `restaurant`, `staff`), so one person can hold several. The restaurant role also carries a `restaurantId`.

**Development users** (all with `SEED_PASSWORD`; ids are fixed because the seed orders point at them)

| Id | Email | Role |
|---|---|---|
| 1 | staff@example.et | staff |
| 2 | almaz@example.et | customer |
| 3 | dawit@example.et | customer |
| 4 | kebede@example.et | courier |
| 5 | abyssinia@example.et | restaurant (restaurant 1) |

Seed orders: Almaz owns 1, 4 and 8; Dawit owns 2, 9 and 12; Kebede is assigned 1, 3, 4 and 9; the other seven belong to nobody with an account.

**The rules** (`OrderPolicy`, one function of user, action and order; it returns a boolean and throws nothing)

| Action | Who may | When |
|---|---|---|
| `read` | staff; the customer who placed it; the courier it is assigned to | always |
| `cancel` | staff; the customer who placed it | staff always; the customer only while `PENDING` |
| `updateStatus` | staff; the assigned courier | staff always; the courier only while `PREPARING` or `ON_THE_WAY` |

**Where each check lives**
| Question | Where | File |
|---|---|---|
| What is the caller? | `RolesGuard` | `common/guards/roles.guard.ts` |
| May they touch *this* order, in *this* state? | `OrderPolicyGuard`, reached with `@CheckPolicy("read" \| "cancel" \| "updateStatus")` | `common/guards/order-policy.guard.ts`, `common/policies/order.policy.ts` |
| Can this operation happen right now? (DELIVERED cannot go back to PENDING) | the service, answering 409 | `orders/orders.service.ts` |

The guard loads the order once and hands it to the handler (`@CurrentOrder()`), so the handler does not load it twice.

**403 or 404: the rule.** *404 for a resource the caller has no right to see; 403 for an action they may not perform on a resource they can legitimately see.* Reading another customer's order is **404**, with the same status and the same words as an order that does not exist, so the ids cannot be counted. A customer cancelling their own order after it left `PENDING` is **403**. The guard logs the truth at `warn` level (`access refused`, with the user and order ids).

**Decisions**
- **The collection is filtered too.** A guard cannot see a list, so `GET /orders` and `GET /restaurants/:id/orders` return only the orders the caller may read. A new order takes its owner from the **token**, never from the body.
- **The policy fails closed.** The `never` default means adding an action (say `"refund"`) stops the build until someone decides who may issue it, and an unknown action at runtime answers *no*.
- **Staff cancelling an order that is already gone is still 204** (idempotent, Day 58). For everyone else a missing order is 404.
- **Open product question:** the restaurant role has no rights over orders yet (the rules table does not say what it should have).
- User ids are handed out in a fixed order (`SEED_USER_ID`) because the seed orders refer to them; seeding is sequential for that reason.

Checks: `npm test` (21 policy specs, no HTTP, no database; most assert a *refusal*) and `bash check-d62.sh` with the server running (restart the server before running it twice: two calls move seeded orders).

### API security (Day 63)
Day 63 audits the API against the OWASP API Top 10. Most of the list was already closed by Days 58 to 62 (validation, access control, error shapes, password handling); today adds the transport, the volume and the payload.

| Control | What it does | Where |
|---|---|---|
| `helmet()` | Security headers on every response; `X-Powered-By` removed. A strict JSON-API Content-Security-Policy (`default-src 'none'`, no framing); only `/docs`, which is not mounted in production, is looser because Swagger UI needs inline scripts. | `main.ts` |
| CORS allow-list | An exact origin list from `CORS_ORIGINS`; a `*` stops the app at startup. `credentials` is **false** because the API reads a Bearer header, not a cookie. | `main.ts`, `config/security.config.ts` |
| Rate limits | 600 requests a minute per address and route for everything; **login and refresh 5 per 15 minutes**; **registration 3 per hour**; `/health` never limited. A refusal is 429 in the five-field error body, with `Retry-After`. | `app.module.ts`, `auth/auth.controller.ts` |
| Body limit | JSON and form bodies are limited to 100 kb. Too large is 413 and malformed JSON is 400, never a 500. | `main.ts`, `common/filters/all-exceptions.filter.ts` |
| Mass assignment | `forbidNonWhitelisted` on every write, and every create assigns its fields **by name**; a request body is never spread into a record. | services |
| Names | Restaurant, dish and customer names accept letters in any script, digits, spaces and `. , ' & ( ) -`. The API *constrains* input and stores what was sent; it does not HTML-escape (that is the frontend's job). | `common/validators/name.pattern.ts` |
| Nothing extra in production | No `/docs`, no `/debug` routes, no development users. | `app.module.ts`, `swagger.setup.ts` |

**Settings** (all optional, see `.env.example`): `CORS_ORIGINS`, `THROTTLE_LIMIT`, `THROTTLE_STRICT_LIMIT`, `THROTTLE_REGISTER_LIMIT`.

**Running it**
- `npm run start:dev` runs with the real limits. The regression scripts log in dozens of times, so for them use `npm run start:dev:relaxed` (a 429 there is the limiter working, not a bug). The counters are in memory, so a restart resets them.
- `bash attack.sh` runs the attack list against your **own** API: it starts three copies of it (real limits, relaxed limits, production mode), runs ten attacks and a few extras, and prints what each one actually did. `bash attack.sh --write` also writes `SECURITY.md` from that run; it never overwrites a `SECURITY.md` that already exists (it writes `SECURITY.generated.md` instead), and `--force` replaces it. Never point any of this at somebody else's system.
- `docs/api-audit.md` has the route-by-route authorisation audit. It found two real problems on Day 63, both fixed: `POST /restaurants` and `POST /dishes` were open to any login, and the OpenAPI spec did not mark the order routes as needing a token.

**Decisions and known limits**
- **One named throttler.** Two named throttlers would *both* apply to every route, so the strict one would limit the whole API. A single `default` throttler, overridden per route with `@Throttle`, does what the slide meant.
- **The global limit is 600 a minute, not 300**, because the exercise's own check (400 reads a minute must be fine) cannot pass at 300. It is `THROTTLE_LIMIT`.
- The counters are in memory: with three instances a limit of five becomes fifteen. Module 7 moves them to Redis, and adds `trust proxy`, because behind a proxy every request has the proxy's address.
- There is no TLS on a laptop. Everything from Days 61 and 62 assumes HTTPS in production (Module 7).
- Rate limiting does not stop a botnet with many addresses. It is one layer, next to argon2, short tokens and, later, monitoring.

### File uploads (Day 64)
Restaurants and dishes can have an image. An upload is the most dangerous route in an API (it accepts arbitrary bytes from a stranger and writes them to disk), so the endpoint is mostly **refusal logic** with a small amount of storage at the end.

| Route | Who | Does |
|---|---|---|
| `POST /api/v1/restaurants/:id/image` | staff, or that restaurant's own user | Upload or replace the restaurant's image |
| `POST /api/v1/dishes/:id/image` | staff, or the restaurant that owns the dish | Upload or replace a dish's image |
| `GET /static/restaurants/<uuid>.webp` | anyone | The stored file (public, cached for a year) |

Send `multipart/form-data` with ONE field named `file` (JPEG, PNG or WebP, at most 2 MB): `curl -X POST .../restaurants/1/image -H "Authorization: Bearer $TOKEN" -F "file=@yod.jpg"`. The record then has `imageUrl`, `thumbUrl` and `imageName` (all `null` until an image exists).

**The pipeline (where each step refuses)**
| # | Step | Where | Fails with |
|---|---|---|---|
| 1 to 3 | JWT, role, `MenuPolicy`: may this user manage this restaurant? | guards, **before any byte is read** | 401, 403, 404 |
| 4 | Multer reads, at most 2 MB (memory storage: the limit is what makes that safe) | `FileInterceptor` | **413** |
| 5 | The polite checks: size, and the *claimed* type | `ParseFilePipe` | 422 |
| 6 | **The real check: the first bytes (JPEG, PNG or WebP)** | `ImageService`, `detectImageType` | 422 |
| 7 | sharp decodes, resizes, strips EXIF, writes WebP (a 50-million-pixel cap stops decompression bombs) | `ImageService` | 422 |
| 8 to 9 | Store both files under generated names, save the record, then delete the old files | `StorageService` | 500, and the new files are rolled back |

**Decisions**
- **`file.mimetype` and `originalname` are strings the caller typed.** A PHP shell renamed `cat.jpg` and sent as `image/jpeg` passes a MIME whitelist and fails the magic-number check (422). The type comes from the bytes, and the stored name is `<uuid>.webp`: nothing the caller sent is ever part of a path.
- **I wrote the 20-line signature check instead of using `file-type`.** Since v17 that package is ESM-only (it breaks this CommonJS project and jest), and it parses hundreds of formats when we accept three. It is one function to swap if the list of formats grows.
- **Re-encoding is a security control:** whatever was hidden in the original does not survive, and neither does the EXIF with its GPS position.
- **Storage is behind an interface** (`put`, `delete`, `urlFor`), exactly as the repositories are. Local disk today (`UPLOAD_DIR`, default `./uploads`, never committed); Module 7 changes one line in `StorageModule`. Local disk in a container loses every image at the next restart.
- **The record keeps keys, never URLs** (`ImageViewInterceptor` builds the URL when the record is read), so a change of bucket or CDN does not make every row wrong.
- **Replacing stores first and deletes last.** There is no transaction across a disk and a database, so the failure chosen is an orphaned file, never a row that points at nothing. A periodic sweep (Day 68) is the plan for what is left.
- **`/static` is public.** A UUID in a path is not a permission, so private files (receipts) must never be served this way.
- **The token now carries `restaurantId`** (a snapshot, like the roles) so `MenuPolicy` can compare it with the menu being changed. That also lets a restaurant add dishes to its own menu.
- Uploads are rate limited (30 an hour per address, `THROTTLE_UPLOAD_LIMIT`) because resizing is real work.

Checks: `npm test` (policy and image specs), then with the server running `bash upload-matrix.sh` (it generates its own test files, including a 5 MB file and a pixel bomb).
