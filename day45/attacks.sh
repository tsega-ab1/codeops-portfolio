#!/usr/bin/env bash
# Run against `npm start` (or `npm run dev`) on port 3045.
B=http://localhost:3045
tok() { node --env-file=.env.local scripts/token.mjs "$1"; }
ALMAZ=$(tok usr_31); DAWIT=$(tok usr_32); STAFF=$(tok usr_10)
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
J='Content-Type: application/json'

echo "ATTACK 1 - signed out cancels ord_812"
echo "  expect 401 -> $(code -X POST $B/api/orders/ord_812/cancel)   [cancelOrderAs: if (!user)]"

echo "ATTACK 2 - Dawit cancels Almaz's order"
echo "  expect 403 -> $(code -X POST -H "Cookie: session=$DAWIT" $B/api/orders/ord_812/cancel)   [cancelOrderAs: order.userId !== user.id]"

echo "ATTACK 3 - crafted sign-in link"
node -e 'import("./lib/safe-redirect.mjs").then(m => console.log("  expect / ->", m.safeNext("https://example.com"), m.safeNext("//example.com"), m.safeNext("/checkout")))'
echo "  [safeNext: must start with / and stay on the same origin]"

echo
echo "EXTRA CHECKS"
echo "Dawit reads Almaz's status (expect 404): $(code -H "Cookie: session=$DAWIT" $B/api/orders/ord_812/status)"
echo "Dawit opens /orders/ord_812 (expect 404): $(code -H "Cookie: session=$DAWIT" $B/orders/ord_812)"
echo "Customer sets a status (expect 403):      $(code -X PATCH -H "$J" -H "Cookie: session=$ALMAZ" -d '{"status":"ready"}' $B/api/orders/ord_790/status)"
echo "Signed out sets a status (expect 401):    $(code -X PATCH -H "$J" -d '{"status":"ready"}' $B/api/orders/ord_790/status)"
echo "Staff sets a status (expect 200):         $(code -X PATCH -H "$J" -H "Cookie: session=$STAFF" -d '{"status":"ready"}' $B/api/orders/ord_790/status)"
echo "Signed out /orders (middleware):          $(curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' $B/orders)"
echo "Forged cookie /orders (page layer):       $(curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' -H 'Cookie: session=forged.value' $B/orders)"
echo "Customer /kitchen:                        $(curl -s -H "Cookie: session=$ALMAZ" $B/kitchen | grep -o '<h1>[^<]*</h1>' | head -1)"
echo "Staff /kitchen:                           $(curl -s -H "Cookie: session=$STAFF" $B/kitchen | grep -o '<h1>[^<]*</h1>' | head -1)"
