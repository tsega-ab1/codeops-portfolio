#!/usr/bin/env bash
# Starts the BUILT app on its own port with LOG_LEVEL=debug, sends requests that carry an
# Authorization header, an x-api-key and a phone number, then inspects every line it wrote.
# Needs a build first:   npm run build        Usage:   bash check-logs.sh
PORT_USED=3055
cd "$(dirname "$0")" || exit 1
[ -f dist/main.js ] || { echo "Run npm run build first."; exit 1; }
STAFF=$(grep -E '^STAFF_API_KEY=' .env | cut -d= -f2-)
CUSTOMER=$(grep -E '^CUSTOMER_API_KEY=' .env | cut -d= -f2-)
LOG=$(mktemp)

PORT=$PORT_USED LOG_LEVEL=debug node dist/main.js > "$LOG" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null; rm -f "$LOG"' EXIT
for _ in $(seq 1 40); do curl -s -o /dev/null "http://localhost:$PORT_USED/api/v1/restaurants" && break; sleep 0.5; done
BASE="http://localhost:$PORT_USED/api/v1"

# a request with all three sensitive things in it: a token, an API key and a phone number
curl -s -o /dev/null -X POST "$BASE/orders" -H "Content-Type: application/json" \
  -H "Authorization: Bearer super-secret-token-123" -H "x-api-key: $STAFF" -H "x-request-id: logcheck-001" \
  -d '{"customer":"Almaz Bekele","area":"Bole","restaurantId":1,"paymentMethod":"TELEBIRR","phone":"0912345678","lines":[{"dishId":1,"quantity":2}]}'
# and a failing one
curl -s -o /dev/null "$BASE/orders/99999" -H "Authorization: Bearer super-secret-token-123" -H "x-api-key: $CUSTOMER" -H "x-request-id: logcheck-002"
sleep 1
kill $PID 2>/dev/null; wait $PID 2>/dev/null

node - "$LOG" "$STAFF" "$CUSTOMER" << 'NODE'
const fs = require("fs");
const [, , file, staff, customer] = process.argv;
const text = fs.readFileSync(file, "utf8");
const lines = text.split("\n").filter((l) => l.trim() !== "");
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "   (" + detail + ")"}`);
};

const parsed = [];
const bad = [];
for (const l of lines) { try { parsed.push(JSON.parse(l)); } catch { bad.push(l); } }
check(`1  every line is one JSON object (${lines.length} lines)`, bad.length === 0, `first bad line: ${bad[0]}`);

const one = parsed.filter((p) => p.requestId === "logcheck-001");
const msgs = one.map((p) => p.msg);
check(`2  all lines of one request share a requestId (${one.length} lines: ${msgs.join(" / ")})`,
  one.length >= 3 && msgs.includes("order created") && msgs.includes("request completed"), `got ${JSON.stringify(msgs)}`);

const secrets = [staff, customer, "super-secret-token-123", "0912345678", "+251912345678"];
const leaked = secrets.filter((s) => s && text.includes(s));
check("3  no key, token or phone number anywhere in the log", leaked.length === 0, `found: ${leaked.map((s) => s.slice(0, 8) + "...").join(", ")}`);

const censored = (text.match(/\[redacted\]/g) || []).length;
check(`4  redaction is active (${censored} fields censored)`, censored >= 3, "no [redacted] found");

const done = one.find((p) => p.msg === "request completed");
check("5  the finished line has handler, status code and duration",
  !!done && typeof done.handler === "string" && done.res?.statusCode === 201 && typeof done.durationMs === "number",
  JSON.stringify(done && { handler: done.handler, status: done.res?.statusCode, ms: done.durationMs }));

const failedLine = parsed.find((p) => p.requestId === "logcheck-002" && p.msg === "request completed");
check("6  a failing request is logged at warn with its status",
  failedLine?.level === "warn" && failedLine.res?.statusCode === 404, JSON.stringify(failedLine && { level: failedLine.level }));

console.log(`\n${6 - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
NODE
