#!/usr/bin/env bash
# Checks the documentation. Needs the dev server running on port 3000 (npm run start:dev)
# and a build in dist/ (the dev server creates it).   Usage:   bash check-d60.sh [base-url]
BASE="${1:-http://localhost:3000}"
cd "$(dirname "$0")" || exit 1
[ -f dist/main.js ] || { echo "Run npm run build first."; exit 1; }

# a production server on another port, to prove the docs disappear there
NODE_ENV=production PORT=3056 node dist/main.js > /dev/null 2>&1 &
PROD=$!
trap 'kill $PROD 2>/dev/null' EXIT
for _ in $(seq 1 40); do curl -s -o /dev/null "http://localhost:3056/api/v1/restaurants" && break; sleep 0.5; done

node - "$BASE" "http://localhost:3056" << 'NODE'
const fs = require("fs");
const [, , base, prod] = process.argv;
let failed = 0;
let total = 0;
const check = (name, ok, detail = "") => {
  total++;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "   (" + detail + ")"}`);
};
const METHODS = ["get", "post", "put", "patch", "delete"];
const operations = (spec) =>
  Object.entries(spec.paths).flatMap(([path, item]) =>
    Object.entries(item).filter(([m]) => METHODS.includes(m)).map(([m, op]) => ({ method: m.toUpperCase(), path, op })));

(async () => {
  const page = await fetch(base + "/docs");
  const html = await page.text();
  check("1  /docs serves the Swagger page", page.status === 200 && /swagger/i.test(html), `status ${page.status}`);

  const spec = await (await fetch(base + "/docs-json")).json();
  const ops = operations(spec);
  const noSummary = ops.filter((o) => !o.op.summary);
  check(`2  every endpoint has a summary (${ops.length} endpoints)`, ops.length >= 12 && noSummary.length === 0,
    noSummary.map((o) => `${o.method} ${o.path}`).join(", "));

  const noFailure = ops.filter((o) => !Object.keys(o.op.responses).some((c) => c.startsWith("4")));
  check("3  every endpoint documents at least one failure code", noFailure.length === 0,
    noFailure.map((o) => `${o.method} ${o.path}`).join(", "));

  const staffOps = ops.filter((o) => ["PATCH", "DELETE"].includes(o.method) && o.path.includes("/orders/"));
  check("4  staff routes document 401 and 403 and use the x-api-key scheme",
    staffOps.length === 2 && staffOps.every((o) => o.op.responses["401"] && o.op.responses["403"] &&
      (o.op.security || []).some((s) => "x-api-key" in s)) && !!spec.components.securitySchemes?.["x-api-key"],
    "check @ApiSecurity and @ApiErrors on PATCH and DELETE");

  // "Try it out": paste the documented example into POST /orders and see whether it really works
  const schema = spec.components.schemas.CreateOrderDto;
  const body = {};
  for (const [key, prop] of Object.entries(schema.properties)) {
    const value = prop.example ?? prop.default;
    if (value !== undefined) body[key] = value;
  }
  const placed = await fetch(base + "/api/v1/orders", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const placedText = await placed.text();
  check("5  the example in the docs places a real order (201)", placed.status === 201,
    `status ${placed.status}: ${placedText.slice(0, 150)}`);

  const hidden = (await fetch(prod + "/docs")).status === 404 && (await fetch(prod + "/docs-json")).status === 404;
  check("6  /docs is not served in production", hidden, "the page is public in production");

  let fileOk = false;
  let detail = "openapi.json is missing: run npm run export:openapi";
  if (fs.existsSync("openapi.json")) {
    const file = JSON.parse(fs.readFileSync("openapi.json", "utf8"));
    const sig = (s) => operations(s).map((o) => `${o.method} ${o.path}`).sort().join("|");
    fileOk = sig(file) === sig(spec);
    detail = "openapi.json is out of date: run npm run export:openapi";
  }
  check("7  openapi.json exists and matches the running API", fileOk, detail);

  console.log(`\n${total - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
NODE
status=$?
if git ls-files --error-unmatch openapi.json >/dev/null 2>&1; then
  echo "NOTE  openapi.json is committed"
else
  echo "NOTE  openapi.json is not committed yet: git add it (criterion 6)"
fi
exit $status
