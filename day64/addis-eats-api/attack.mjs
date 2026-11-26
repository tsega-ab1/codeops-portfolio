// The Day 63 attack list, run against YOUR OWN API on YOUR OWN machine (see attack.sh).
// Prints what each attack ACTUALLY did. With --write it also writes SECURITY.md from those observed results.
import { createRequire } from "node:module";
import { existsSync, writeFileSync } from "node:fs";

const require = createRequire(process.cwd() + "/");
const jwt = require("jsonwebtoken");
const { A, B, C } = process.env; // A: real limits, B: relaxed login limits, C: production mode
const WRITE = process.argv.includes("--write");
const SEED = process.env.SEED_PASSWORD;
const rows = [];

const call = async (base, method, path, { token, body, headers = {}, raw } = {}) => {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  if (body !== undefined && !raw) h["Content-Type"] = "application/json";
  const res = await fetch(base + "/api/v1" + path, { method, headers: h, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: res.status, headers: res.headers, text, json };
};
const login = async (base, email) => (await call(base, "POST", "/auth/login", { body: { email, password: SEED } })).json?.accessToken;
const FIVE = ["statusCode", "message", "path", "timestamp", "requestId"];
const fiveFields = (j) => j && FIVE.every((k) => k in j);
const leaksStack = (text) => /\bat [\w$.<>]+ \(|node_modules|\.ts:\d+|stack/i.test(text);
const add = (n, item, attack, expected, pass, actual, before, changed) => rows.push({ n, item, attack, expected, pass, actual, before, changed });
const pool = async (items, size, fn) => { const out = []; let i = 0; await Promise.all(Array.from({ length: size }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; };

const almaz = await login(B, "almaz@example.et");
const staff = await login(B, "staff@example.et");
if (!almaz || !staff) { console.error("Could not log in on the relaxed server: is SEED_PASSWORD set in .env?"); process.exit(2); }

// 1  API1: walk the order ids with your own token
{
  const own = (await call(B, "GET", "/orders?limit=50", { token: almaz })).json.items.map((o) => o.id);
  const ids = Array.from({ length: 500 }, (_, i) => i + 1);
  const results = await pool(ids, 20, async (id) => ({ id, status: (await call(B, "GET", `/orders/${id}`, { token: almaz })).status }));
  const ok200 = results.filter((r) => r.status === 200).map((r) => r.id);
  const n404 = results.filter((r) => r.status === 404).length;
  const other = results.filter((r) => r.status !== 200 && r.status !== 404).length;
  const pass = ok200.every((id) => own.includes(id)) && ok200.length === own.filter((id) => id <= 500).length && other === 0;
  add(1, "API1", "GET /orders/1..500 with a customer's own token", "404 for every stranger's order",
    pass, `${ok200.length} x 200 (ids ${ok200.sort((a, b) => a - b).join(",")}: all her own), ${n404} x 404, ${other} other`,
    "Closed on Day 62 (policy); the 404 body is identical to a missing order's", "Nothing today. Day 62's OrderPolicyGuard answers 404.");
}

// 2  API3: mass assignment
{
  const r = await call(B, "POST", "/auth/register", { body: { email: `mass${Date.now()}@example.et`, password: "a-long-passphrase-123", roles: ["staff"] } });
  const names = JSON.stringify(r.json?.message ?? "");
  add(2, "API3", 'Register with "roles": ["staff"] in the body', "400, naming roles",
    r.status === 400 && /roles/.test(names), `${r.status}: ${names}`,
    "400 (forbidNonWhitelisted, Day 58)", "Kept. AuthService also sets roles itself; the body is never spread into a user.");
}

// 3  API6: brute force on login (server A has the real limits)
{
  const statuses = []; let last;
  for (let i = 0; i < 6; i++) {
    last = await call(A, "POST", "/auth/login", { body: { email: "almaz@example.et", password: "definitely-wrong-1" } });
    statuses.push(last.status);
  }
  const retry = Number(last.headers.get("retry-after"));
  const pass = statuses.slice(0, 5).every((s) => s === 401) && statuses[5] === 429 && retry > 0 && fiveFields(last.json) && last.json.requestId && last.json.message === "Too many requests";
  add(3, "API6", "Six wrong logins in a row", "429 with Retry-After",
    pass, `${statuses.join(" ")}, Retry-After: ${last.headers.get("retry-after")}s, five-field body with requestId`,
    "401 x 6: nothing ever limited it", "@nestjs/throttler: 5 login attempts per 15 minutes per address, Retry-After on the 429.");
}

// 4  API4: oversized body
{
  const big = JSON.stringify({ x: "a".repeat(5 * 1024 * 1024) });
  const r = await call(B, "POST", "/orders", { token: almaz, raw: big, headers: { "Content-Type": "application/json" } });
  add(4, "API4", "POST a 5 MB JSON body", "413, refused",
    r.status === 413 && fiveFields(r.json) && !leaksStack(r.text), `${r.status}: ${JSON.stringify(r.json?.message)}, no stack trace`,
    "500 Internal server error: the body parser's error was not mapped, so a client mistake looked like our bug",
    "100 kb body limit, and the error filter maps body-parser errors (413, malformed JSON 400) to their real status.");
}

// 5  API5: function-level
{
  const r = await call(B, "DELETE", "/orders/1", { token: almaz });
  add(5, "API5", "DELETE /orders/1 as a customer", "403", r.status === 403, `${r.status}: ${JSON.stringify(r.json?.message)}`,
    "403 (policy, Day 62)", "Nothing today.");
}

// 6  API2: no credentials
{
  const r = await call(B, "GET", "/orders");
  add(6, "API2", "A request with no Authorization header", "401", r.status === 401, `${r.status}: ${JSON.stringify(r.json?.message)}`,
    "401 (global JwtAuthGuard, Day 61)", "Nothing today.");
}

// 7  API2: expired token, signed with the real secret
{
  const expired = jwt.sign({ sub: 2, email: "almaz@example.et", roles: ["customer"] }, process.env.JWT_ACCESS_SECRET, { expiresIn: -60 });
  const r = await call(B, "GET", "/auth/me", { token: expired });
  add(7, "API2", "A correctly signed token that expired a minute ago", "401", r.status === 401, `${r.status}: ${JSON.stringify(r.json?.message)}`,
    "401 expected (Day 61); not measured before today", "Nothing today.");
}

// 8  API8/9: docs in production
{
  const prod = await call(C, "GET", "/docs").catch(() => ({ status: "no answer" }));
  const dev = await fetch(B + "/docs").then((r) => r.status);
  add(8, "API8, API9", "GET /docs with NODE_ENV=production", "404", prod.status === 404, `production: ${prod.status} (development: ${dev})`,
    "404 in production (Day 60)", "Nothing today. Swagger stays off in production.");
}

// 9  API8: preflight from a stranger's origin, and from the real one
{
  const pf = (origin) => fetch(B + "/api/v1/orders", { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type" } });
  const evil = await pf("https://evil.example");
  const good = await pf("http://localhost:5173");
  const evilAllowed = evil.headers.get("access-control-allow-origin");
  const goodAllowed = good.headers.get("access-control-allow-origin");
  add(9, "API8", "An OPTIONS preflight from https://evil.example", "Not allowed (and the listed origin is)",
    !evilAllowed && goodAllowed === "http://localhost:5173",
    `evil.example: ${evil.status}, Access-Control-Allow-Origin ${evilAllowed ?? "absent"}; localhost:5173: ${good.status}, allow-origin ${goodAllowed ?? "absent"}`,
    "404 and no CORS headers at all: refused by accident, and the real frontend could not call the API either",
    "enableCors with an explicit list from CORS_ORIGINS; credentials false (we use a Bearer header, not cookies).");
}

// 10  API8: force a 500 and read the body
{
  const dev = await call(B, "GET", "/debug/boom", { token: staff });
  const prod = await call(C, "GET", "/debug/boom").catch(() => ({ status: "no answer" }));
  add(10, "API8", "Force a 500 and read the body", "No stack trace",
    dev.status === 500 && fiveFields(dev.json) && dev.json.message === "Internal server error" && !leaksStack(dev.text) && prod.status === 404,
    `${dev.status}: ${JSON.stringify(dev.json?.message)}, five fields, no stack; in production the debug route does not exist (${prod.status})`,
    "Nothing could trigger one safely, so it had never been checked", "Added a staff-only /debug/boom (never mounted in production) to prove the filter hides the detail.");
}

// Extras beyond the ten
{
  const r = await call(B, "GET", "/restaurants");
  const h = (k) => r.headers.get(k);
  const pass = !h("x-powered-by") && !!h("strict-transport-security") && h("x-content-type-options") === "nosniff" && !!h("content-security-policy") && !!h("x-frame-options");
  add("x1", "API8", "Read the security headers on any response", "helmet's set, X-Powered-By gone", pass,
    `X-Powered-By ${h("x-powered-by") ?? "absent"}; HSTS ${h("strict-transport-security") ? "present" : "absent"}; nosniff ${h("x-content-type-options") ?? "absent"}; CSP ${h("content-security-policy") ? "present" : "absent"}; X-Frame-Options ${h("x-frame-options") ?? "absent"}`,
    "X-Powered-By: Express; none of the others", "helmet(), with a strict JSON-API Content-Security-Policy (looser only for /docs).");
}
{
  const reads = await pool(Array.from({ length: 400 }, (_, i) => i), 25, () => call(A, "GET", "/restaurants").then((r) => r.status));
  const bad = reads.filter((s) => s !== 200).length;
  add("x2", "API4", "400 GET /restaurants in under a minute", "Still fine (no customer is inconvenienced)", bad === 0,
    `${reads.length - bad} x 200, ${bad} other`, "200 (nothing limited it)", "The global limit is generous: 600 a minute per address and route.");
}
{
  const reads = await pool(Array.from({ length: 700 }, (_, i) => i), 25, () => call(A, "GET", "/health").then((r) => r.status));
  const bad = reads.filter((s) => s !== 200).length;
  add("x3", "API4", "700 GET /health in under a minute", "Never limited (a load balancer polls it)", bad === 0,
    `${reads.length - bad} x 200, ${bad} other`, "no /health route existed", "Added /health with @SkipThrottle().");
}
{
  const r = await call(B, "POST", "/restaurants", { token: staff, body: { name: "<script>fetch('//evil')</script>", area: "Bole" } });
  add("x4", "API3", "Create a restaurant named <script>fetch('//evil')</script>", "400: the name is constrained, not escaped", r.status === 400,
    `${r.status}: ${JSON.stringify(r.json?.message)}`, "201: the script tag was stored and would be served to every client",
    "Names accept letters, digits, spaces and . , ' & ( ) - only. The API constrains input; it does not HTML-escape stored data.");
}
{
  const r = await call(B, "POST", "/auth/login", { raw: "{not json", headers: { "Content-Type": "application/json" } });
  add("x5", "API8", "POST a malformed JSON body", "400 in the standard shape", r.status === 400 && fiveFields(r.json) && !leaksStack(r.text),
    `${r.status}: ${JSON.stringify(r.json?.message)}`, "not measured: the same unmapped body-parser path as row 4", "Mapped by the error filter.");
}
{
  const r = await call(B, "POST", "/dishes", { token: staff, body: { id: 999, name: "Tibs", priceSantim: 15000, restaurantId: 1 } });
  add("x6", "API3", "Create a dish and choose its own id", "400: id is not a writable field", r.status === 400 && /id/.test(JSON.stringify(r.json?.message)),
    `${r.status}: ${JSON.stringify(r.json?.message)}`, "400 (forbidNonWhitelisted)", "Both create methods now assign every field by name instead of spreading the body.");
}

{
  const r = await call(B, "POST", "/restaurants", { token: almaz, body: { name: "Almaz Cafe", area: "Bole" } });
  add("x7", "API5", "A customer adds a restaurant (POST /restaurants)", "403: staff only", r.status === 403, `${r.status}: ${JSON.stringify(r.json?.message)}`,
    "201 for ANY logged-in user: found by the Day 63 route audit", "@Roles(\"staff\") on POST /restaurants.");
}
{
  const r = await call(B, "POST", "/dishes", { token: almaz, body: { name: "Free Dish", priceSantim: 100, restaurantId: 1 } });
  add("x8", "API5", "A customer adds a dish to a menu (POST /dishes)", "403: staff only", r.status === 403, `${r.status}: ${JSON.stringify(r.json?.message)}`,
    "201 for ANY logged-in user: found by the Day 63 route audit", "@Roles(\"staff\") on POST /dishes until the DishPolicy homework lets a restaurant manage its own menu.");
}

// ---------- report
const pad = (s, n) => String(s).padEnd(n);
console.log("");
for (const r of rows) console.log(`${r.pass ? "PASS" : "FAIL"}  ${pad(r.n, 3)} ${pad(r.item, 10)} ${r.attack}\n          expected: ${r.expected}\n          actual:   ${r.actual}`);
const failed = rows.filter((r) => !r.pass).length;
console.log(`\n${rows.length - failed} of ${rows.length} behaved as expected`);

if (WRITE) {
  const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
  const ten = rows.filter((r) => typeof r.n === "number"), extra = rows.filter((r) => typeof r.n !== "number");
  const table = (list) => ["| # | Item | Attack | Should be | Before today | What actually happened (this run) | Changed |", "|---|---|---|---|---|---|---|",
    ...list.map((r) => `| ${r.n} | ${cell(r.item)} | ${cell(r.attack)} | ${cell(r.expected)} | ${cell(r.before)} | ${r.pass ? "OK" : "**FAILED**"}: ${cell(r.actual)} | ${cell(r.changed)} |`)].join("\n");
  const md = `# SECURITY.md: Addis Eats API, Day 63

Run on ${new Date().toISOString().slice(0, 10)} against my own API on my own machine (\`bash attack.sh --write\`). Every "What actually happened" cell is
copied from that run, not written by hand. "Before today" is what the Day 62 code did when I probed it ahead of the hardening.

## What an attacker would want here
Order totals, TeleBirr phone numbers and delivery addresses: that is what is worth stealing, so orders and login get the most attention.
The adversaries that matter for an Addis Ababa food app are a curious customer, a competitor scraping the menu, a credential stuffer and a bored script.
A determined, funded attacker is a different discipline and is not claimed to be covered here.

## The ten attacks
${table(ten)}

## Extra checks
${table(extra)}

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
- Behind a proxy every request has the proxy's address. Module 7 needs \`app.set("trust proxy", 1)\`, and only when I control that proxy.
- There is no TLS on my laptop. Everything from Days 61 and 62 assumes HTTPS in production (Module 7).
- The global limit is 600 a minute, not the 300 in the slide, because the slide's own check (400 reads a minute must be fine) cannot pass at 300. It is \`THROTTLE_LIMIT\` in .env.
- Rate limiting does not stop a botnet with many addresses. It is one layer, next to argon2, short tokens and (later) monitoring.

## My own attack (homework)
Add the eleventh row here after reading my own controllers for the check I skipped.
`;
  const target = existsSync("SECURITY.md") && !process.argv.includes("--force") ? "SECURITY.generated.md" : "SECURITY.md";
  writeFileSync(target, md);
  console.log(target === "SECURITY.md" ? "\nWrote SECURITY.md from this run." : "\nSECURITY.md already exists, so I did NOT overwrite it (your own edits are safe).\nWrote SECURITY.generated.md from this run: copy any new rows across by hand, or use --write --force to replace SECURITY.md.");
}
process.exit(failed ? 1 : 0);
