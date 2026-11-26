#!/usr/bin/env bash
# The Day 63 attack list. It starts THREE copies of your own API on your own machine (never anyone else's):
#   A  port 3057  the real rate limits, for the brute-force and volume attacks
#   B  port 3058  relaxed login limits, so the other attacks can log in as often as they like
#   C  port 3059  NODE_ENV=production, to prove /docs and the debug route are gone
# Usage:  bash attack.sh            run the ten attacks (and a few extras)
#         bash attack.sh --write    also write SECURITY.md from what actually happened
cd "$(dirname "$0")" || exit 1
[ -f .env ] || { echo "No .env here: copy .env.example and fill it in."; exit 1; }
echo "building..."; npx nest build > /dev/null || { echo "build failed"; exit 1; }
set -a; . ./.env; set +a

PIDS=()
cleanup() { for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null; done; }
trap cleanup EXIT

start() { # port, then VAR=value pairs
  local port=$1; shift
  env PORT="$port" "$@" node dist/main.js > "/tmp/attack-$port.log" 2>&1 &
  PIDS+=($!)
}
start 3057
start 3058 THROTTLE_STRICT_LIMIT=10000 THROTTLE_REGISTER_LIMIT=10000
start 3059 NODE_ENV=production

for port in 3057 3058 3059; do
  for _ in $(seq 1 40); do
    curl -s -o /dev/null "http://localhost:$port/api/v1/health" && break
    sleep 0.5
  done
  curl -s -o /dev/null "http://localhost:$port/api/v1/health" || { echo "The server on $port did not start. See /tmp/attack-$port.log"; exit 1; }
done

A=http://localhost:3057 B=http://localhost:3058 C=http://localhost:3059 node attack.mjs "$@"
