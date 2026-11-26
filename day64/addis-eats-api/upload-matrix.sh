#!/usr/bin/env bash
# The Day 64 upload matrix. Needs the dev server running.   Usage:  bash upload-matrix.sh [base-url]
# Files are written to UPLOAD_DIR (default ./uploads). Restart the server before a second run only if you want a clean count.
BASE="${1:-http://localhost:3000/api/v1}"
ORIGIN="${BASE%/api/v1}"
cd "$(dirname "$0")" || exit 1
SEED=$(grep -E '^SEED_PASSWORD=' .env | cut -d= -f2-)
UP=$(grep -E '^UPLOAD_DIR=' .env 2>/dev/null | cut -d= -f2-); UP="${UP:-./uploads}"

pass=0; fail=0
ok()  { pass=$((pass + 1)); printf 'PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf 'FAIL  %s   (%s)\n' "$1" "$2"; }
login() { curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$1\",\"password\":\"$SEED\"}" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken" 2>/dev/null; }
json() { printf '%s' "$BODY" | node -p "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); $1" 2>/dev/null; }

RESTAURANT=$(login abyssinia@example.et); CUSTOMER=$(login almaz@example.et); STAFF=$(login staff@example.et)
[ -n "$RESTAURANT" ] && [ "$RESTAURANT" != undefined ] || { echo "Could not log in: is the server running, is SEED_PASSWORD in .env, or is the login rate limit hit? (restart the server, or run npm run start:dev:relaxed)"; exit 1; }

FIX=$(mktemp -d); trap 'rm -rf "$FIX"' EXIT
echo "making fixtures (the bomb takes a few seconds)..."; node scripts/make-fixtures.mjs "$FIX" > /dev/null || { echo "could not make fixtures"; exit 1; }

# post NAME WANT TOKEN PATH [curl -F args...]
post() {
  local name=$1 want=$2 token=$3 path=$4; shift 4
  local args=(-s -o /tmp/d64.body -w '%{http_code}' -X POST "$BASE$path")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  CODE=$(curl "${args[@]}" "$@"); BODY=$(cat /tmp/d64.body)
  if [ "$CODE" = "$want" ]; then ok "$name -> $CODE"; else bad "$name" "want $want, got $CODE: ${BODY:0:150}"; fi
}
file() { echo "file=@$FIX/$1;type=${2:-image/jpeg}"; }
count_files() { find "$UP/restaurants" -type f 2>/dev/null | wc -l | tr -d ' '; }
sharp_exif() { node -e "const s=require('sharp');s(process.argv[1]).metadata().then(m=>process.stdout.write(m.exif?'yes':'no'))" "$1"; }

DISH1=$(curl -s "$BASE/restaurants/1/dishes" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).items[0].id")
DISH2=$(curl -s "$BASE/restaurants/2/dishes" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).items[0].id")

echo "--- the nine calls"
post "1  restaurant uploads yod.jpg to its own restaurant"   201 "$RESTAURANT" /restaurants/1/image -F "$(file yod.jpg)"
URL=$(json 'j.imageUrl'); THUMB=$(json 'j.thumbUrl'); NAME=$(json 'j.imageName')
post "2  a 5 MB file"                                        413 "$RESTAURANT" /restaurants/1/image -F "$(file big.jpg)"
post "3  a customer uploads"                                 403 "$CUSTOMER"   /restaurants/1/image -F "$(file yod.jpg)"
post "4  no token"                                           401 ""            /restaurants/1/image -F "$(file yod.jpg)"
post "5  no file at all"                                     400 "$RESTAURANT" /restaurants/1/image
post "6  the wrong field name"                               400 "$RESTAURANT" /restaurants/1/image -F "wrongfield=@$FIX/yod.jpg;type=image/jpeg"
post "7  a PDF renamed .jpg, sent as image/jpeg"             422 "$RESTAURANT" /restaurants/1/image -F "$(file fake-pdf.jpg)"
post "8  a PHP web shell renamed .jpg, sent as image/jpeg"   422 "$RESTAURANT" /restaurants/1/image -F "$(file shell.jpg)"
post "9  restaurant 1's user uploads to restaurant 2"        403 "$RESTAURANT" /restaurants/2/image -F "$(file yod.jpg)"

echo "--- more refusals and the dish route"
post "10 a pixel bomb (64 million pixels in under 2 MB)"     422 "$RESTAURANT" /restaurants/1/image -F "$(file bomb.png image/png)"
post "11 an image for a restaurant that does not exist"      404 "$STAFF"      /restaurants/9999/image -F "$(file yod.jpg)"
post "12 a restaurant user uploads a PNG to its own dish"    201 "$RESTAURANT" /dishes/$DISH1/image -F "$(file logo.png image/png)"
DISH_URL=$(json 'j.imageUrl')
post "13 ...but not to a dish on another menu"               403 "$RESTAURANT" /dishes/$DISH2/image -F "$(file logo.png image/png)"
post "14 staff upload to any restaurant"                     201 "$STAFF"      /restaurants/2/image -F "$(file yod.jpg)"

echo "--- what was actually stored (criteria 3 to 6)"
[[ "$URL" =~ ^/static/restaurants/[0-9a-f-]{36}\.webp$ ]] && ok "the stored name is a UUID plus an extension from the BYTES ($URL)" || bad "stored name" "$URL"
case "$URL$THUMB" in *yod*|*jpg*|*jpeg*) bad "the stored name resembles the input" "$URL";; *) ok "no stored filename resembles any input";; esac
[ "$NAME" = "yod.jpg" ] && ok "the original name is kept as a label only (imageName: $NAME)" || bad "imageName" "$NAME"
FULL_BYTES=$(curl -s "$ORIGIN$URL" | wc -c | tr -d ' '); THUMB_BYTES=$(curl -s "$ORIGIN$THUMB" | wc -c | tr -d ' ')
[ "$THUMB_BYTES" -gt 0 ] && [ "$THUMB_BYTES" -lt "$FULL_BYTES" ] && ok "two variants exist and the thumbnail is smaller ($THUMB_BYTES < $FULL_BYTES bytes)" || bad "variants" "full $FULL_BYTES thumb $THUMB_BYTES"
HDRS=$(curl -sI "$ORIGIN$URL")
printf '%s' "$HDRS" | grep -qi 'content-type: image/webp' && ok "it is served as image/webp" || bad "content type" "$HDRS"
printf '%s' "$HDRS" | grep -qi 'cache-control:.*immutable' && ok "it is cached for a year (the name never changes)" || bad "cache" "$HDRS"
printf '%s' "$HDRS" | grep -qi 'cross-origin-resource-policy: cross-origin' && ok "another origin's <img> may load it (CORP cross-origin)" || bad "CORP" "$HDRS"
[ "$(sharp_exif "$FIX/yod.jpg")" = yes ] && ok "the INPUT had EXIF (so the next check means something)" || bad "fixture has no EXIF" ""
[ "$(sharp_exif "$UP/${URL#/static/}")" = no ] && [ "$(sharp_exif "$UP/${THUMB#/static/}")" = no ] && ok "no EXIF, so no GPS position, in either stored file" || bad "EXIF survived" "$UP/${URL#/static/}"
curl -s "$BASE/restaurants/1" > /tmp/d64.body; BODY=$(cat /tmp/d64.body)
[ "$(json 'j.imageUrl')" = "$URL" ] && ok "the public restaurant now shows its imageUrl" || bad "GET /restaurants/1" "$BODY"
curl -s "$BASE/restaurants/3" > /tmp/d64.body; BODY=$(cat /tmp/d64.body)
[ "$(json 'j.imageUrl === null && j.thumbUrl === null && j.imageName === null')" = true ] && ok "a restaurant with no image answers null, not a missing field" || bad "empty case" "$BODY"
printf '%s' "$BODY" | grep -q '"image"' && bad "internal keys leaked" "$BODY" || ok "the record's internal keys are never in the response"
[[ "$DISH_URL" =~ ^/static/dishes/[0-9a-f-]{36}\.webp$ ]] && ok "a dish image is stored under dishes/ ($DISH_URL)" || bad "dish image" "$DISH_URL"

echo "--- replacing (criterion 5)"
BEFORE=$(count_files)
post "15 upload a second image to the same restaurant" 201 "$RESTAURANT" /restaurants/1/image -F "$(file yod.jpg)"
URL2=$(json 'j.imageUrl')
[ "$URL2" != "$URL" ] && ok "the replacement has a new name" || bad "same name" "$URL2"
[ "$(count_files)" = "$BEFORE" ] && ok "the old pair is gone: still one pair per image ($BEFORE files before and after)" || bad "orphans" "before $BEFORE after $(count_files)"
[ ! -e "$UP/${URL#/static/}" ] && [ "$(curl -s -o /dev/null -w '%{http_code}' "$ORIGIN$URL")" = 404 ] && ok "the old image is no longer served (404)" || bad "old file still there" "$URL"

echo "--- who may add a dish"
post "16 the restaurant adds a dish to its own menu"   201 "$RESTAURANT" /dishes -H 'Content-Type: application/json' -d '{"name":"Shiro Wot","priceSantim":9000,"restaurantId":1}'
post "17 ...but not to another restaurant's menu"       403 "$RESTAURANT" /dishes -H 'Content-Type: application/json' -d '{"name":"Shiro Wot","priceSantim":9000,"restaurantId":2}'
post "18 a customer cannot add a dish"                  403 "$CUSTOMER"   /dishes -H 'Content-Type: application/json' -d '{"name":"Shiro Wot","priceSantim":9000,"restaurantId":1}'

echo; echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
