# SECURITY.md: Addis Eats API, Day 63

Run on 2026-11-26 against my own API on my own machine (`bash attack.sh --write`). Every "What actually happened" cell is
copied from that run, not written by hand. "Before today" is what the Day 62 code did when I probed it ahead of the hardening.

## What an attacker would want here
Order totals, TeleBirr phone numbers and delivery addresses: that is what is worth stealing, so orders and login get the most attention.
The adversaries that matter for an Addis Ababa food app are a curious customer, a competitor scraping the menu, a credential stuffer and a bored script.
A determined, funded attacker is a different discipline and is not claimed to be covered here.

## The ten attacks
| # | Item | Attack | Should be | Before today | What actually happened (this run) | Changed |
|---|---|---|---|---|---|---|
| 1 | API1 | GET /orders/1..500 with a customer's own token | 404 for every stranger's order | Closed on Day 62 (policy); the 404 body is identical to a missing order's | OK: 3 x 200 (ids 1,4,8: all her own), 497 x 404, 0 other | Nothing today. Day 62's OrderPolicyGuard answers 404. |
| 2 | API3 | Register with "roles": ["staff"] in the body | 400, naming roles | 400 (forbidNonWhitelisted, Day 58) | OK: 400: ["property roles should not exist"] | Kept. AuthService also sets roles itself; the body is never spread into a user. |
| 3 | API6 | Six wrong logins in a row | 429 with Retry-After | 401 x 6: nothing ever limited it | OK: 401 401 401 401 401 429, Retry-After: 900s, five-field body with requestId | @nestjs/throttler: 5 login attempts per 15 minutes per address, Retry-After on the 429. |
| 4 | API4 | POST a 5 MB JSON body | 413, refused | 500 Internal server error: the body parser's error was not mapped, so a client mistake looked like our bug | OK: 413: "Request body is too large (the limit is 100 kb)", no stack trace | 100 kb body limit, and the error filter maps body-parser errors (413, malformed JSON 400) to their real status. |
| 5 | API5 | DELETE /orders/1 as a customer | 403 | 403 (policy, Day 62) | OK: 403: "You are not allowed to cancel order 1" | Nothing today. |
| 6 | API2 | A request with no Authorization header | 401 | 401 (global JwtAuthGuard, Day 61) | OK: 401: "Authentication required: send an Authorization: Bearer <token> header" | Nothing today. |
| 7 | API2 | A correctly signed token that expired a minute ago | 401 | 401 expected (Day 61); not measured before today | OK: 401: "The access token has expired: call POST /auth/refresh" | Nothing today. |
| 8 | API8, API9 | GET /docs with NODE_ENV=production | 404 | 404 in production (Day 60) | OK: production: 404 (development: 200) | Nothing today. Swagger stays off in production. |
| 9 | API8 | An OPTIONS preflight from https://evil.example | Not allowed (and the listed origin is) | 404 and no CORS headers at all: refused by accident, and the real frontend could not call the API either | OK: evil.example: 204, Access-Control-Allow-Origin absent; localhost:5173: 204, allow-origin http://localhost:5173 | enableCors with an explicit list from CORS_ORIGINS; credentials false (we use a Bearer header, not cookies). |
| 10 | API8 | Force a 500 and read the body | No stack trace | Nothing could trigger one safely, so it had never been checked | OK: 500: "Internal server error", five fields, no stack; in production the debug route does not exist (404) | Added a staff-only /debug/boom (never mounted in production) to prove the filter hides the detail. |

## Extra checks
| # | Item | Attack | Should be | Before today | What actually happened (this run) | Changed |
|---|---|---|---|---|---|---|
| x1 | API8 | Read the security headers on any response | helmet's set, X-Powered-By gone | X-Powered-By: Express; none of the others | OK: X-Powered-By absent; HSTS present; nosniff nosniff; CSP present; X-Frame-Options SAMEORIGIN | helmet(), with a strict JSON-API Content-Security-Policy (looser only for /docs). |
| x2 | API4 | 400 GET /restaurants in under a minute | Still fine (no customer is inconvenienced) | 200 (nothing limited it) | OK: 400 x 200, 0 other | The global limit is generous: 600 a minute per address and route. |
| x3 | API4 | 700 GET /health in under a minute | Never limited (a load balancer polls it) | no /health route existed | OK: 700 x 200, 0 other | Added /health with @SkipThrottle(). |
| x4 | API3 | Create a restaurant named <script>fetch('//evil')</script> | 400: the name is constrained, not escaped | 201: the script tag was stored and would be served to every client | OK: 400: ["name must contain only letters, digits, spaces and . , ' & ( ) -"] | Names accept letters, digits, spaces and . , ' & ( ) - only. The API constrains input; it does not HTML-escape stored data. |
| x5 | API8 | POST a malformed JSON body | 400 in the standard shape | not measured: the same unmapped body-parser path as row 4 | OK: 400: "Expected property name or '}' in JSON at position 1 (line 1 column 2)" | Mapped by the error filter. |
| x6 | API3 | Create a dish and choose its own id | 400: id is not a writable field | 400 (forbidNonWhitelisted) | OK: 400: ["property id should not exist"] | Both create methods now assign every field by name instead of spreading the body. |
| x7 | API5 | A customer adds a restaurant (POST /restaurants) | 403: staff only | 201 for ANY logged-in user: found by the Day 63 route audit | OK: 403: "This action requires the role: staff" | @Roles("staff") on POST /restaurants. |
| x8 | API5 | A customer adds a dish to a menu (POST /dishes) | 403: staff only | 201 for ANY logged-in user: found by the Day 63 route audit | OK: 403: "This action requires the role: staff" | @Roles("staff") on POST /dishes until the DishPolicy homework lets a restaurant manage its own menu. |

## The OWASP API Top 10, where I stand
| # | Risk | State | Why |
|---|---|---|---|
| API1 | Broken object-level authorisation | Closed | Day 62: OrderPolicy, 404 for another customer's order, collections filtered (attack 1) |
| API2 | Broken authentication | Closed | Day 61: argon2, one message for both login failures, short access tokens, rotating refresh tokens; today login and refresh are rate limited |
| API3 | Broken object property authorisation | Closed for what exists | forbidNonWhitelisted plus explicit field assignment in every create (attacks 2, x4, x6) |
| API4 | Unrestricted resource consumption | Closed, in memory only | 100 kb body limit, 600 requests a minute per address and route; the counters live in one process |
| API5 | Broken function-level authorisation | Closed after the route audit | Day 62: @Roles and the policy (attack 5). The audit then found POST /restaurants and POST /dishes open to any login; both are staff only now (x7, x8) |
| API6 | Unrestricted access to sensitive flows | Closed | Login 5 per 15 minutes, register 3 per hour, refresh 5 per 15 minutes (attack 3) |
| API7 | Server-side request forgery | Not applicable yet | The API makes no outbound calls until Day 67 |
| API8 | Security misconfiguration | Closed for today's list | helmet, explicit CORS list, no stack traces, no debug route or /docs in production (attacks 8 to 10, x1) |
| API9 | Improper inventory management | Mostly closed | Everything is under /api/v1 and in the generated Swagger document; the debug module is not mounted in production |
| API10 | Unsafe consumption of third-party APIs | Not applicable yet | Nothing third-party is consumed until Days 65 and 67 |

## Limits I know about
- The rate-limit counters are in memory. With three instances a limit of five becomes fifteen. Module 7 moves them to Redis.
- Behind a proxy every request has the proxy's address. Module 7 needs `app.set("trust proxy", 1)`, and only when I control that proxy.
- There is no TLS on my laptop. Everything from Days 61 and 62 assumes HTTPS in production (Module 7).
- The global limit is 600 a minute, not the 300 in the slide, because the slide's own check (400 reads a minute must be fine) cannot pass at 300. It is `THROTTLE_LIMIT` in .env.
- Rate limiting does not stop a botnet with many addresses. It is one layer, next to argon2, short tokens and (later) monitoring.

## My own attack (homework)
Add the eleventh row here after reading my own controllers for the check I skipped.
