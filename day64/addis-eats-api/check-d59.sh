#!/usr/bin/env bash
# The Day 59 acceptance checks. Usage:  bash check-d59.sh [base-url]
# (the log line for criterion 4 is read in the server terminal, see the README)
BASE="${1:-http://localhost:3000/api/v1}"
ROOT="${BASE%/v1}"
cd "$(dirname "$0")" || exit 1
SEED=$(grep -E '^SEED_PASSWORD=' .env | cut -d= -f2-)
# Day 61: identity is a token now. Log in once as each dev user and reuse the access tokens.
login() {
  curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$SEED\"}" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken"
}
STAFF=$(login staff@example.et)
CUSTOMER=$(login almaz@example.et)
[ -n "$STAFF" ] && [ "$STAFF" != undefined ] || { echo "Could not log in: is the server running, is SEED_PASSWORD in .env, or is the login rate limit hit? (restart the server, or run npm run start:dev:relaxed)"; exit 1; }

pass=0
fail=0
ok()  { pass=$((pass + 1)); printf 'PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf 'FAIL  %s   (%s)\n' "$1" "$2"; }
# req ...curl args... : fills CODE, HEADERS, BODY
req() {
  CODE=$(curl -s -D /tmp/d59.headers -o /tmp/d59.body -w '%{http_code}' "$@")
  HEADERS=$(cat /tmp/d59.headers); BODY=$(cat /tmp/d59.body)
}
header() { printf '%s' "$HEADERS" | grep -i "^$1:" | head -1 | cut -d: -f2- | tr -d '\r '; }
five() { # an error body must carry all five fields
  for k in statusCode message path timestamp requestId; do printf '%s' "$BODY" | grep -q "\"$k\"" || return 1; done
}

req -H "Authorization: Bearer $CUSTOMER" "$BASE/orders"; id=$(header x-request-id)
[[ "$id" =~ ^[0-9a-f-]{36}$ ]] && ok "1  a response carries a generated x-request-id" || bad "1  generated id" "got '$id'"

req -H "Authorization: Bearer $CUSTOMER" -H "x-request-id: mine-123" "$BASE/orders"
[ "$(header x-request-id)" = "mine-123" ] && ok "2  a caller's id is echoed unchanged" || bad "2  echo" "got '$(header x-request-id)'"

req -H "Authorization: Bearer $CUSTOMER" -H "x-request-id: bad id with spaces" "$BASE/orders"; id=$(header x-request-id)
[[ "$id" =~ ^[0-9a-f-]{36}$ ]] && ok "3  an unsafe id is replaced by a uuid" || bad "3  unsafe id" "got '$id'"

req -H "Authorization: Bearer $CUSTOMER" -H "x-request-id: trace-77" "$BASE/orders/99999"
if [ "$CODE" = 404 ] && printf '%s' "$BODY" | grep -q '"requestId":"trace-77"'; then ok "4  the error body requestId matches the header (no longer null)"; else bad "4  requestId in body" "$BODY"; fi

req "$ROOT/orders"; id=$(header x-request-id)
[ "$CODE" = 404 ] && [ -n "$id" ] && ok "5  even a 404 for an unknown path carries x-request-id" || bad "5  404 header" "code $CODE, id '$id'"

req -X DELETE "$BASE/orders/6"
if [ "$CODE" = 401 ] && printf '%s' "$BODY" | grep -q 'Authentication required' && five; then ok "6  no token on a staff route: 401, naming the header"; else bad "6  401" "$CODE $BODY"; fi

req -X DELETE -H "Authorization: Bearer not-a-real-token" "$BASE/orders/6"
if [ "$CODE" = 401 ] && printf '%s' "$BODY" | grep -q 'Invalid access token'; then ok "7  a forged token: 401 (a bad credential is 401 now, not 403)"; else bad "7  401 bad token" "$CODE $BODY"; fi

# Day 62: order 6 is nobody's, so to a customer it does not exist (404). The role gate itself is proved on
# the status route, which still needs the courier or staff role: a customer is refused there with 403.
req -X PATCH -H "Authorization: Bearer $CUSTOMER" -H "Content-Type: application/json" -d '{"status":"PREPARING"}' "$BASE/orders/6/status"
if [ "$CODE" = 403 ] && printf '%s' "$BODY" | grep -q 'requires the role: courier or staff'; then ok "8  @Roles(\"courier\",\"staff\") blocks a customer token: 403"; else bad "8  roles" "$CODE $BODY"; fi

req -X DELETE -H "Authorization: Bearer $STAFF" "$BASE/orders/6"
[ "$CODE" = 204 ] && ok "9  the staff token passes both guards: 204" || bad "9  staff 204" "$CODE"

req "$BASE/restaurants?limit=1"
[ "$CODE" = 200 ] && ok "10 browsing routes stay open with no token at all" || bad "10 open route" "$CODE"

req "$BASE/delivery-fees?area=bole"; a=$CODE; b1=$BODY
req "$BASE/delivery-fees?area=BOLE"; b2=$BODY
req "$BASE/delivery-fees?area=adama"; c=$CODE
if [ "$a" = 200 ] && printf '%s' "$b1" | grep -q '"area":"Bole"' && printf '%s' "$b2" | grep -q '"area":"Bole"' && [ "$c" = 400 ] && printf '%s' "$BODY" | grep -q 'must be one of'; then
  ok "11 ParseAreaPipe: bole and BOLE become Bole, adama is 400"; else bad "11 area pipe" "$a / $c $BODY"; fi

req -H "Authorization: Bearer $STAFF" "$BASE/debug/slow?ms=1000"; fast=$CODE
start=$(date +%s)
req -H "Authorization: Bearer $STAFF" "$BASE/debug/slow?ms=6000"; secs=$(( $(date +%s) - start ))
if [ "$fast" = 200 ] && [ "$CODE" = 408 ] && five && [ "$secs" -ge 4 ] && [ "$secs" -le 7 ]; then
  ok "12 a 6-second handler answers 408 after ~5s, with the five-field body (took ${secs}s)"; else bad "12 timeout" "fast $fast, slow $CODE in ${secs}s: $BODY"; fi

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
