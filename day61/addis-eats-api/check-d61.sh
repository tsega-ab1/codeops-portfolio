#!/usr/bin/env bash
# The Day 61 acceptance checks: register, login, /auth/me, refresh rotation, the 401/403 split.
# Needs the dev server running.   Usage:  bash check-d61.sh [base-url]
BASE="${1:-http://localhost:3000/api/v1}"
cd "$(dirname "$0")" || exit 1
SEED=$(grep -E '^SEED_PASSWORD=' .env | cut -d= -f2-)
EMAIL="check$RANDOM$RANDOM@example.et"      # a fresh address, so the script can be run again

pass=0; fail=0
ok()  { pass=$((pass + 1)); printf 'PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf 'FAIL  %s   (%s)\n' "$1" "$2"; }
req() { CODE=$(curl -s -o /tmp/d61.body -w '%{http_code}' "$@"); BODY=$(cat /tmp/d61.body); }
json() { printf '%s' "$BODY" | node -p "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); $1" 2>/dev/null; }
post() { local path=$1; shift; req -X POST "$BASE$path" -H 'Content-Type: application/json' "$@"; }

post /auth/register -d "{\"email\":\"$EMAIL\",\"password\":\"a-long-passphrase-123\"}"
if [ "$CODE" = 201 ] && [ "$(json 'j.email')" = "$EMAIL" ] && [ "$(json 'j.roles.join()')" = "customer" ] && ! printf '%s' "$BODY" | grep -qiE 'password|hash'; then
  ok "1  register: 201, role customer, no password or hash in the answer"; else bad "1  register" "$CODE $BODY"; fi

post /auth/register -d "{\"email\":\"$EMAIL\",\"password\":\"a-long-passphrase-123\"}"
[ "$CODE" = 409 ] && ok "2  the same email again: 409" || bad "2  duplicate" "$CODE $BODY"

post /auth/register -d "{\"email\":\"short$RANDOM@example.et\",\"password\":\"tooshort\"}"
[ "$CODE" = 400 ] && ok "3  a password under 10 characters: 400" || bad "3  short password" "$CODE $BODY"

post /auth/login -d "{\"email\":\"$EMAIL\",\"password\":\"a-long-passphrase-123\"}"
ACCESS=$(json 'j.accessToken'); REFRESH=$(json 'j.refreshToken')
if [ "$CODE" = 200 ] && [ "${#ACCESS}" -gt 50 ] && [ "${#REFRESH}" -gt 50 ] && [ "$ACCESS" != "$REFRESH" ]; then
  ok "4  login: 200 and two different tokens (login is not 201: nothing is created)"; else bad "4  login" "$CODE $BODY"; fi

post /auth/login -d "{\"email\":\"$EMAIL\",\"password\":\"the-wrong-password\"}"; A="$CODE $(json 'j.message')"
post /auth/login -d "{\"email\":\"nobody$RANDOM@example.et\",\"password\":\"the-wrong-password\"}"; B="$CODE $(json 'j.message')"
[ "${A%% *}" = 401 ] && [ "$A" = "$B" ] && ok "5  wrong password and unknown email give the identical 401 (no account enumeration)" || bad "5  same answer" "'$A' vs '$B'"

req "$BASE/auth/me" -H "Authorization: Bearer $ACCESS"
if [ "$CODE" = 200 ] && [ "$(json 'j.email')" = "$EMAIL" ] && [ "$(json 'j.roles.join()')" = "customer" ]; then
  ok "6  /auth/me with the token: 200, the caller's own id, email and roles"; else bad "6  me" "$CODE $BODY"; fi

req "$BASE/auth/me"
[ "$CODE" = 401 ] && ok "7  /auth/me with no token: 401" || bad "7  me without token" "$CODE $BODY"

req "$BASE/auth/me" -H "Authorization: Bearer ${ACCESS%?}X"
[ "$CODE" = 401 ] && ok "8  a token with one character changed: 401 (the signature check)" || bad "8  tampered" "$CODE $BODY"

req "$BASE/auth/me" -H "Authorization: Bearer $REFRESH"
[ "$CODE" = 401 ] && ok "9  a refresh token cannot be used as an access token: 401" || bad "9  refresh as access" "$CODE $BODY"

post /auth/refresh -d "{\"refreshToken\":\"$ACCESS\"}"
[ "$CODE" = 401 ] && ok "10 an access token cannot be used to refresh: 401" || bad "10 access as refresh" "$CODE $BODY"

post /auth/refresh -d "{\"refreshToken\":\"$REFRESH\"}"; NEW=$(json 'j.refreshToken')
if [ "$CODE" = 200 ] && [ -n "$NEW" ] && [ "$NEW" != "$REFRESH" ]; then ok "11 refresh: 200 and a NEW refresh token (rotation)"; else bad "11 refresh" "$CODE $BODY"; fi

post /auth/refresh -d "{\"refreshToken\":\"$REFRESH\"}"
[ "$CODE" = 401 ] && ok "12 the OLD refresh token is dead the moment it is used: 401" || bad "12 reuse" "$CODE $BODY"

req "$BASE/restaurants?limit=1"
[ "$CODE" = 200 ] && ok "13 browsing is still open with no token" || bad "13 open" "$CODE"
req "$BASE/orders"
[ "$CODE" = 401 ] && ok "14 orders without a token: 401 (protected by default)" || bad "14 protected" "$CODE"

req -X DELETE "$BASE/orders/1" -H "Authorization: Bearer $ACCESS"
[ "$CODE" = 403 ] && ok "15 a customer token on a staff route: 403 (known, and the answer is no)" || bad "15 role" "$CODE $BODY"

echo; echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
