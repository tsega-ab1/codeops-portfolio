#!/usr/bin/env bash
# Day 62 homework (the route audit), run properly in Day 63. It found two real problems; this fixes them and records the audit.
# Run from INSIDE day63/addis-eats-api/ :   bash day63-audit-fixes.sh
set -e
[ -f src/health/health.controller.ts ] || { echo "Run this inside day63/addis-eats-api (after day63-security.sh)."; exit 1; }

node - << 'NODE'
const fs = require("fs");
const edit = (f, fn) => { const t = fs.readFileSync(f, "utf8"); const r = fn(t); fs.writeFileSync(f, r); console.log(r === t ? "already " + f : "edited  " + f); };
const tidy = (t) => t.replace(/@Public\(\)\n\n(\s*)@Get/g, "@Public()\n$1@Get");

// FINDING 1: POST /restaurants and POST /dishes needed only SOME login, so a customer could add restaurants and dishes.
edit("src/restaurants/restaurants.controller.ts", (t) => tidy(t.includes("@Roles") ? t : t
  .replace('import { Public } from "../common/decorators/public.decorator.js";', 'import { Public } from "../common/decorators/public.decorator.js";\nimport { Roles } from "../common/decorators/roles.decorator.js";')
  .replace("import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags }", "import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags }")
  .replace("  @Post() // 201 + a Location header pointing at the new restaurant\n", '  @Post() // 201 + a Location header pointing at the new restaurant\n  @Roles("staff") // adding a restaurant is Addis Eats staff work (Day 63 audit: it used to need only ANY login)\n  @ApiBearerAuth("bearer")\n')
  .replace('  @ApiErrors({ 400: "Validation failed: a field is missing or malformed, or an undeclared field was sent." })\n  create', '  @ApiErrors({\n    400: "Validation failed: a field is missing or malformed, or an undeclared field was sent.",\n    401: "Missing, invalid or expired access token.",\n    403: "The caller is not staff.",\n  })\n  create')));

edit("src/dishes/dishes.controller.ts", (t) => tidy(t.includes("@Roles") ? t : t
  .replace('import { Public } from "../common/decorators/public.decorator.js";', 'import { Public } from "../common/decorators/public.decorator.js";\nimport { Roles } from "../common/decorators/roles.decorator.js";')
  .replace("import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags }", "import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags }")
  .replace("  @Post() // 201 + a Location header pointing at the new dish\n", '  @Post() // 201 + a Location header pointing at the new dish\n  // Staff only for now. The restaurant role may add dishes to ITS OWN menu only: that needs a DishPolicy (homework),\n  // because the token does not say which restaurant a user belongs to.\n  @Roles("staff")\n  @ApiBearerAuth("bearer")\n')
  .replace('    404: "The restaurant does not exist.",\n  })\n  create', '    401: "Missing, invalid or expired access token.",\n    403: "The caller is not staff.",\n    404: "The restaurant does not exist.",\n  })\n  create')));

// FINDING 2: GET /orders, POST /orders and GET /orders/:id need a token but the OpenAPI spec did not say so,
// so Swagger's Authorize button would not send one. Declare it once for the whole controller.
edit("src/orders/orders.controller.ts", (t) => t.includes('@ApiBearerAuth("bearer")\n@ApiTags("orders")') ? t : t.replace('@ApiTags("orders")', '@ApiBearerAuth("bearer") // every order route needs a token: say so once, for the whole controller\n@ApiTags("orders")'));

for (const f of ["src/dishes/restaurant-dishes.controller.ts", "src/orders/delivery-fees.controller.ts"]) edit(f, tidy);
NODE

node - << 'NODE'
const fs = require("fs");
let t = fs.readFileSync("docs/api-audit.md", "utf8");
if (!t.includes("## Authorisation audit")) {
  t = t.trimEnd() + `

# Authorisation audit - Day 62 homework, rechecked on Day 63

Every endpoint classified as **public**, **any login**, **role only** or **policy**. Nothing is left unclassified.
Checked against the decorators in the code, not from memory, and against \`openapi.json\`.

| Route | Who may call it | Gate | Rate limit |
|---|---|---|---|
| GET /health | anyone | public | none (a load balancer polls it) |
| POST /auth/register | anyone | public | 3 per hour per address |
| POST /auth/login | anyone | public | 5 per 15 minutes per address |
| POST /auth/refresh | a holder of a refresh token | public | 5 per 15 minutes per address |
| GET /auth/me | any login | token | default |
| GET /delivery-fees | anyone | public | default |
| GET /restaurants, GET /restaurants/:id | anyone | public | default |
| GET /dishes, GET /dishes/:id | anyone | public | default |
| GET /restaurants/:id/dishes, GET /restaurants/:id/dishes/:dishId | anyone | public | default |
| POST /restaurants | staff | **role only** | default |
| POST /dishes | staff | **role only** (restaurant role: DishPolicy homework) | default |
| GET /orders | any login | token, and the **service filters** the list by OrderPolicy | default |
| GET /restaurants/:id/orders | any login | token, and the **service filters** the list by OrderPolicy | default |
| POST /orders | any login | token; the owner is taken from the token, never from the body | default |
| GET /orders/:id | the customer, the assigned courier, staff | **policy** \`read\` (404 for everyone else) | default |
| DELETE /orders/:id | staff; the owner while PENDING | **policy** \`cancel\` (403 once it cannot be cancelled) | default |
| PATCH /orders/:id/status | staff; the assigned courier | **role** courier or staff, then **policy** \`updateStatus\` | default |
| GET /debug/* | staff, development only | role only; the module is not mounted in production | default |

"Public" on the catalogue routes is on purpose: a menu is meant to be read by anyone. Public data is what a competitor would scrape,
so those routes are protected by rate limiting (Day 63), not by a login.

## What the audit found (and fixed on Day 63)
1. **POST /restaurants and POST /dishes needed only some login.** Any customer could add a restaurant or put a dish on a menu. They are now \`@Roles("staff")\`.
   The restaurant role should be able to add dishes to its *own* menu: that needs a \`DishPolicy\` and the user's \`restaurantId\`, which the token does not carry yet (homework).
2. **The OpenAPI spec did not mark GET /orders, POST /orders or GET /orders/:id as needing a token.** The routes were protected, but Swagger's Authorize button
   would not have sent the token for them. \`@ApiBearerAuth\` is now on the whole orders controller.

## Still open, on purpose
- The restaurant role has no order rights yet: it sees no orders and cannot change one. The rules table does not say what it should be able to do, which is a product question.
`;
  fs.writeFileSync("docs/api-audit.md", t); console.log("edited  docs/api-audit.md");
}
NODE

echo
echo "Done. Next:  npx tsc --noEmit && npm run export:openapi && bash attack.sh --write"
