#!/usr/bin/env bash
# The Day 62 matrix: five users, the six rules, and the collections. Needs the dev server running.
# Usage:  bash check-d62.sh [base-url]        Restart the server before a second run: two calls move seeded orders.
BASE="${1:-http://localhost:3000/api/v1}"
cd "$(dirname "$0")" || exit 1
SEED=$(grep -E '^SEED_PASSWORD=' .env | cut -d= -f2-)

pass=0; fail=0
ok()  { pass=$((pass + 1)); printf 'PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf 'FAIL  %s   (%s)\n' "$1" "$2"; }
login() { curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1\",\"password\":\"$SEED\"}" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken" 2>/dev/null; }
STAFF=$(login staff@example.et); ALMAZ=$(login almaz@example.et); DAWIT=$(login dawit@example.et)
KEBEDE=$(login kebede@example.et); ABYSSINIA=$(login abyssinia@example.et)
[ -n "$STAFF" ] && [ "$STAFF" != undefined ] || { echo "Could not log in: is the server running, is SEED_PASSWORD in .env, or is the login rate limit hit? (restart the server, or run npm run start:dev:relaxed)"; exit 1; }

# call NAME TOKEN METHOD PATH EXPECTED_CODE [json-body]
call() {
  local name=$1 token=$2 method=$3 path=$4 want=$5 body=${6:-}
  local args=(-s -o /tmp/d62.body -w '%{http_code}' -X "$method" "$BASE$path")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' -d "$body")
  CODE=$(curl "${args[@]}"); BODY=$(cat /tmp/d62.body)
  if [ "$CODE" = "$want" ]; then ok "$name -> $CODE"; else bad "$name" "want $want, got $CODE: ${BODY:0:140}"; fi
}
total() { printf '%s' "$BODY" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).total" 2>/dev/null; }
ids()   { printf '%s' "$BODY" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).items.map(o=>o.id).sort((a,b)=>a-b).join(',')" 2>/dev/null; }
msg()   { printf '%s' "$BODY" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).message.replace(/[0-9]+/,'N')" 2>/dev/null; }
NEW='{"customer":"Almaz Bekele","area":"Bole","restaurantId":1,"paymentMethod":"CASH","lines":[{"dishId":1,"quantity":1}]}'

echo "--- rule 1: staff reads any order; a customer reads their own"
call "staff reads order 1"                   "$STAFF"  GET /orders/1 200
call "almaz reads her own order 1"           "$ALMAZ"  GET /orders/1 200
call "dawit reads almaz's order 1"           "$DAWIT"  GET /orders/1 404; STRANGER=$(msg)
call "almaz reads order 9999 (no such)"      "$ALMAZ"  GET /orders/9999 404; MISSING=$(msg)
[ "$STRANGER" = "$MISSING" ] && ok "a stranger's order and a missing order answer in the SAME words" || bad "404 bodies differ" "'$STRANGER' vs '$MISSING'"
call "no token at all"                       ""        GET /orders/1 401
call "restaurant role reads order 1"         "$ABYSSINIA" GET /orders/1 404
call "GET /orders/boom is still a 400"       "$ALMAZ"  GET /orders/boom 400

echo "--- rule 3: a customer cancels their own order, only while PENDING"
call "almaz places a new order"              "$ALMAZ"  POST /orders 201 "$NEW"; N1=$(printf '%s' "$BODY" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
printf '%s' "$BODY" | grep -q '"customerId":2' && ok "the new order is owned by the TOKEN's user (almaz, id 2)" || bad "owner" "$BODY"
call "dawit cancels almaz's PENDING order"   "$DAWIT"  DELETE /orders/$N1 404
call "almaz cancels her own order 1 (DELIVERED)" "$ALMAZ" DELETE /orders/1 403
call "kebede (courier) cancels the order he delivers" "$KEBEDE" DELETE /orders/3 403
call "almaz cancels her own PENDING order"   "$ALMAZ"  DELETE /orders/$N1 204
call "almaz reads it again: gone"            "$ALMAZ"  GET /orders/$N1 404
call "almaz places another order"            "$ALMAZ"  POST /orders 201 "$NEW"; N2=$(printf '%s' "$BODY" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
call "staff cancels any order"               "$STAFF"  DELETE /orders/$N2 204
call "staff cancels an order that is already gone (idempotent)" "$STAFF" DELETE /orders/$N2 204

echo "--- rules 4 and 5: a courier moves only THEIR orders, only from the right state"
call "almaz (customer) moves order 4"        "$ALMAZ"  PATCH /orders/4/status 403 '{"status":"ON_THE_WAY"}'
call "kebede moves order 2 (not his)"        "$KEBEDE" PATCH /orders/2/status 404 '{"status":"PREPARING"}'
call "kebede moves order 1 (his, but DELIVERED)" "$KEBEDE" PATCH /orders/1/status 403 '{"status":"CANCELLED"}'
call "kebede: order 4 PREPARING -> ON_THE_WAY" "$KEBEDE" PATCH /orders/4/status 200 '{"status":"ON_THE_WAY"}'
call "kebede: order 9 ON_THE_WAY -> DELIVERED" "$KEBEDE" PATCH /orders/9/status 200 '{"status":"DELIVERED"}'
call "kebede: a move the SERVICE refuses is still 409" "$KEBEDE" PATCH /orders/3/status 409 '{"status":"PENDING"}'
call "staff moves any order (Day 60 rule still holds)" "$STAFF" PATCH /orders/5/status 409 '{"status":"PENDING"}'

echo "--- rule 6 is the DishPolicy homework; the restaurant role has no order rights yet"
call "restaurant role moves an order"        "$ABYSSINIA" PATCH /orders/4/status 403 '{"status":"CANCELLED"}'

echo "--- the collections (the check people forget)"
# Judge each list by WHO the orders belong to, not by an exact count, so another suite that placed an order as almaz
# (check-d60 does) cannot make this one fail. A list is right when every item is the caller's and the seeded ones are there.
owned() { # FIELD VALUE id,id,id : every item has FIELD == VALUE, and the listed ids are all present
  printf '%s' "$BODY" | node -e "
    const j = JSON.parse(require('fs').readFileSync(0,'utf8'));
    const [field, value, want] = process.argv.slice(1);
    const have = j.items.map((o) => o.id);
    const allMine = j.items.every((o) => String(o[field]) === value);
    const present = want.split(',').every((id) => have.includes(Number(id)));
    process.exit(allMine && present && j.total === j.items.length ? 0 : 1)" "$1" "$2" "$3" 2>/dev/null
}
call "almaz lists orders"     "$ALMAZ"  GET "/orders?limit=50" 200; owned customerId 2 1,4,8 && ok "  every order is almaz's, and 1,4,8 are there (total $(total))" || bad "  almaz's list" "total $(total) ids $(ids)"
call "dawit lists orders"     "$DAWIT"  GET "/orders?limit=50" 200; [ "$(total)" = 3 ] && [ "$(ids)" = "2,9,12" ] && ok "  dawit sees exactly 2,9,12" || bad "  dawit's list" "total $(total) ids $(ids)"
call "kebede lists orders"    "$KEBEDE" GET "/orders?limit=50" 200; owned courierId 4 1,3,4,9 && ok "  every order is kebede's delivery, and 1,3,4,9 are there" || bad "  kebede's list" "total $(total) ids $(ids)"
call "the restaurant lists orders" "$ABYSSINIA" GET "/orders?limit=50" 200; [ "$(total)" = 0 ] && ok "  the restaurant role sees none" || bad "  restaurant list" "total $(total)"
call "staff lists orders"     "$STAFF"  GET "/orders?limit=50" 200; [ "$(total)" -ge 14 ] && ok "  staff see everything ($(total))" || bad "  staff list" "total $(total)"
call "almaz lists restaurant 1's orders" "$ALMAZ" GET "/restaurants/1/orders?limit=50" 200; owned customerId 2 1,4 && ok "  ...and only her own there (1 and 4 among them)" || bad "  restaurant 1 list" "ids $(ids)"
call "almaz asks for a smaller page of the same list" "$ALMAZ" GET "/orders?limit=2&fields=id,status" 200
MINE=$(total); call "almaz lists everything again" "$ALMAZ" GET "/orders?limit=50" 200
[ "$MINE" = "$(total)" ] && [ "$MINE" -lt 14 ] && ok "  total counts only what she may read ($MINE), not the table" || bad "  total leaks" "page total $MINE, full total $(total)"

echo; echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
