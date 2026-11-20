#!/usr/bin/env bash
# Day 60 checks: structured logging (pino) and Swagger / OpenAPI.
# Run from day60/addis-eats-api/. It builds, exports openapi.json, then boots its OWN servers
# on ports 3055 (LOG_LEVEL=debug) and 3056 (production), so the dev server on 3000 is left alone.
cd "$(dirname "$0")"

PASS=0; FAIL=0; PIDS=""
trap 'kill $PIDS 2>/dev/null' EXIT

check() { # check "what" 'shell snippet'  (passes when the snippet succeeds)
  if eval "$2" >/dev/null 2>&1; then echo "  ok    $1"; PASS=$((PASS+1)); else echo "  FAIL  $1"; FAIL=$((FAIL+1)); fi
}

LOGJS='
const fs = require("fs");
const rows = fs.readFileSync(process.argv[1], "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } });
process.exit(new Function("rows", "return (" + process.argv[2] + ");")(rows) ? 0 : 1);
'
JSONJS='
const fs = require("fs");
const doc = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
process.exit(new Function("doc", "return (" + process.argv[2] + ");")(doc) ? 0 : 1);
'
logs() { node -e "$LOGJS" "$LOG" "$1"; }      # logs "<js expression over rows>"
doc()  { node -e "$JSONJS" "$1" "$2"; }       # doc FILE "<js expression over doc>"
hdr()  { curl -s -D - -o /dev/null "$@" | tr -d '\r'; }

start() { # start PORT NODE_ENV LOG_LEVEL LOGFILE
  PORT=$1 NODE_ENV=$2 LOG_LEVEL=$3 node dist/main.js >"$4" 2>"$4.err" &
  PIDS="$PIDS $!"
}
wait_up() { for _ in $(seq 1 40); do curl -s -o /dev/null "http://localhost:$1/api/v1/restaurants" && return 0; sleep 0.5; done; return 1; }

for p in 3055 3056; do
  curl -s -o /dev/null "http://localhost:$p/" && { echo "Port $p is busy; stop whatever uses it and run again."; exit 1; }
done

echo "Building and exporting openapi.json ..."
npm run export:openapi >/tmp/d60-export.log 2>&1 || { echo "Build/export failed:"; tail -25 /tmp/d60-export.log; exit 1; }

LOG=/tmp/d60-server.log; PLOG=/tmp/d60-prod.log
ROOT=http://localhost:3055; A=$ROOT/api/v1; PROD=http://localhost:3056
start 3055 test debug "$LOG"
start 3056 production info "$PLOG"
wait_up 3055 || { echo "Server on 3055 did not start:"; tail -20 "$LOG" "$LOG.err"; exit 1; }
wait_up 3056 || { echo "Production server on 3056 did not start:"; tail -20 "$PLOG" "$PLOG.err"; exit 1; }

# ---- the requests (each with its own id, so the log checks can find them)
LONG=$(printf 'a%.0s' $(seq 1 200))
STAFF_KEY=$(grep '^STAFF_API_KEY=' .env | cut -d= -f2-)
curl -s -o /dev/null -H "x-request-id: d60-key" -H "x-api-key: $STAFF_KEY" "$A/orders?limit=1"
curl -s -o /tmp/d60-err.json -H "x-request-id: mine-123" "$A/orders/99999"
curl -s -o /dev/null -X DELETE -H "x-request-id: d60-401" "$A/orders/6"
ORDER_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -H "x-request-id: d60-order" "$A/orders" \
  -d '{ "customer": "Almaz Bekele", "area": "Bole", "restaurantId": 1, "paymentMethod": "TELEBIRR", "phone": "0912345678", "lines": [{ "dishId": 1, "quantity": 2 }] }')
curl -sL -o /tmp/d60-docs.html -w "%{http_code}" "$ROOT/docs" >/tmp/d60-docs.code
curl -s -o /tmp/d60-openapi.json "$ROOT/docs-json"
sleep 1

echo "Request id"
check "a response carries an x-request-id (a uuid)" 'hdr "$A/orders?limit=1" | grep -qiE "^x-request-id: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"'
check "a caller id (mine-123) is echoed unchanged" 'hdr -H "x-request-id: mine-123" "$A/orders?limit=1" | grep -qi "^x-request-id: mine-123$"'
check "an unsafe id (200 characters) is replaced by a fresh uuid" 'hdr -H "x-request-id: $LONG" "$A/orders?limit=1" | grep -qiE "^x-request-id: [0-9a-f]{8}-"'
E_ERR='doc.requestId === "mine-123" && Object.keys(doc).length === 5'
check "the error body carries the same requestId (five fields)" 'doc /tmp/d60-err.json "$E_ERR"'

echo "Structured logs"
check "every log line is one JSON object" 'logs "rows.length > 5 && rows.every(Boolean)"'
check "level is a word (\"info\"), never a number" 'logs "rows.some(r => r.level === \"info\") && !rows.some(r => typeof r.level === \"number\")"'
L_404='rows.some(r => r.requestId === "mine-123" && r.res && r.res.statusCode === 404 && r.level === "warn" && String(r.handler).includes("OrdersController.findOne") && typeof r.durationMs === "number")'
check "the 404 line: caller requestId, handler, durationMs, level warn" 'logs "$L_404"'
L_401='rows.some(r => r.requestId === "d60-401" && r.res && r.res.statusCode === 401 && r.level === "warn")'
check "a request refused by a guard (401) is logged too" 'logs "$L_401"'
check "the staff key never appears in the log" '[ -n "$STAFF_KEY" ] && ! grep -qF "$STAFF_KEY" "$LOG"'
L_KEY='rows.some(r => r.requestId === "d60-key" && r.req && r.req.headers && r.req.headers["x-api-key"] === "[redacted]")'
check "the x-api-key header is censored, not dropped" 'logs "$L_KEY"'
check "a valid order is created (201)" '[ "$ORDER_CODE" = 201 ]'
L_SVC='rows.some(r => r.msg === "order saved" && r.requestId === "d60-order")'
check "a service line carries the request id without being handed it" 'logs "$L_SVC"'
L_PHONE='rows.some(r => r.msg === "order saved" && JSON.stringify(r).includes("[redacted]"))'
check "the phone number is censored in the debug line" 'logs "$L_PHONE" && ! grep -q 0912345678 "$LOG"'
check "the Swagger page is kept out of the log" '! grep -q "\"url\":\"/docs" "$LOG"'

echo "Swagger / OpenAPI"
check "/docs serves the page (200, html)" '[ "$(cat /tmp/d60-docs.code)" = 200 ] && grep -qi "swagger" /tmp/d60-docs.html'
E_INFO='doc.openapi.startsWith("3.") && doc.info.title === "Addis Eats API"'
check "/docs-json is an OpenAPI 3 document titled Addis Eats API" 'doc /tmp/d60-openapi.json "$E_INFO"'
check "npm run export:openapi wrote the same kind of document to openapi.json" 'doc openapi.json "$E_INFO"'
E_PATHS='["/api/v1/orders","/api/v1/orders/{id}","/api/v1/orders/{id}/status","/api/v1/restaurants","/api/v1/restaurants/{restaurantId}/dishes/{dishId}","/api/v1/dishes","/api/v1/delivery-fees"].every(p => p in doc.paths)'
check "the versioned paths are all documented" 'doc /tmp/d60-openapi.json "$E_PATHS"'
E_NODEBUG='!Object.keys(doc.paths).some(p => p.includes("debug"))'
check "the debug route is not in the docs" 'doc /tmp/d60-openapi.json "$E_NODEBUG"'
E_SUMMARY='Object.values(doc.paths).every(item => Object.values(item).every(op => typeof op.summary === "string" && op.summary.length > 0))'
check "every documented operation has a summary" 'doc /tmp/d60-openapi.json "$E_SUMMARY"'
E_SEC='doc.components.securitySchemes["x-api-key"].in === "header" && doc.paths["/api/v1/orders/{id}"].delete.security.some(s => "x-api-key" in s) && doc.paths["/api/v1/orders/{id}/status"].patch.security.some(s => "x-api-key" in s) && !doc.paths["/api/v1/orders"].get.security'
check "only the staff routes ask for the x-api-key" 'doc /tmp/d60-openapi.json "$E_SEC"'
E_ERRSCHEMA='Object.keys(doc.components.schemas.ErrorResponse.properties).sort().join() === "message,path,requestId,statusCode,timestamp"'
check "the shared error shape has the five fields" 'doc /tmp/d60-openapi.json "$E_ERRSCHEMA"'
E_DTO='["customer","lines"].every(k => k in doc.components.schemas.CreateOrderDto.properties) && ["OrderResponse","DishResponse","RestaurantResponse"].every(n => n in doc.components.schemas)'
check "the CLI plugin filled the DTO schemas, and the response schemas exist" 'doc /tmp/d60-openapi.json "$E_DTO"'

echo "Production"
check "production: /docs and /docs-json are not served (404)" '[ "$(curl -s -o /dev/null -w "%{http_code}" $PROD/docs)" = 404 ] && [ "$(curl -s -o /dev/null -w "%{http_code}" $PROD/docs-json)" = 404 ]'
check "production: the API itself still answers (200)" '[ "$(curl -s -o /dev/null -w "%{http_code}" $PROD/api/v1/restaurants)" = 200 ]'
check "production: the debug route does not exist (404)" '[ "$(curl -s -o /dev/null -w "%{http_code}" $PROD/api/v1/debug/slow?ms=1)" = 404 ]'

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
