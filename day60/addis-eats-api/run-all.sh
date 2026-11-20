#!/usr/bin/env bash
# Sends every request listed in expected.md and checks: the status code, the message,
# the five error fields, and that no stack trace appears.
# Usage:  bash run-all.sh [base-url]        (default http://localhost:3000/api/v1)
BASE="${1:-http://localhost:3000/api/v1}"
cd "$(dirname "$0")" || exit 1

# staff routes (PATCH status, DELETE) need the key from .env; sending it everywhere is harmless
KEY=$(grep -E '^STAFF_API_KEY=' .env 2>/dev/null | cut -d= -f2-)
auth=()
[ -n "$KEY" ] && auth=(-H "x-api-key: $KEY")

trim() { local v="$*"; v="${v#"${v%%[![:space:]]*}"}"; v="${v%"${v##*[![:space:]]}"}"; printf '%s' "$v"; }

pass=0
fail=0
while IFS='|' read -r -u 3 _ num file req want frag _; do
  num=$(trim "$num"); file=$(trim "$file"); req=$(trim "$req")
  want=$(trim "$want"); frag=$(trim "$frag")
  case "$num" in 0[0-9] | 1[0-9] | x[0-9]) ;; *) continue ;; esac

  method=${req%% *}
  path=${req#* }
  if [ "$file" = "-" ]; then
    out=$(curl -s -w $'\n%{http_code}' -X "$method" "${auth[@]}" "$BASE$path")
  else
    out=$(curl -s -w $'\n%{http_code}' -X "$method" "${auth[@]}" -H "Content-Type: application/json" --data @"$file" "$BASE$path")
  fi
  got=${out##*$'\n'}
  body=${out%$'\n'*}

  problems=""
  [ "$got" = "$want" ] || problems="$problems code"
  printf '%s' "$body" | grep -qF -- "$frag" || problems="$problems message"
  if [ "${got:0:1}" != "2" ]; then
    for key in statusCode message path timestamp requestId; do
      printf '%s' "$body" | grep -q "\"$key\"" || problems="$problems missing-$key"
    done
    printf '%s' "$body" | grep -Eq '"stack"|node_modules|    at ' && problems="$problems STACK-TRACE"
  fi

  msg=$(printf '%s' "$body" | grep -o '"message":.*' | cut -c1-70)
  if [ -z "$problems" ]; then
    pass=$((pass + 1)); printf 'PASS  %-3s %-4s %-24s %s\n' "$num" "$got" "$req" "$msg"
  else
    fail=$((fail + 1)); printf 'FAIL  %-3s %-4s %-24s want %s | %s\n' "$num" "$got" "$req" "$want" "$problems"
    printf '      body: %s\n' "$(printf '%s' "$body" | cut -c1-200)"
  fi
done 3< expected.md

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
