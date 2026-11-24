#!/usr/bin/env bash
# Day 61 - part 2: connects the auth pieces that day61-jwt-auth.sh created to the rest of the app.
# Run it from INSIDE day61/addis-eats-api/ AFTER day61-jwt-auth.sh:   bash day61-wire.sh
# Safe to run twice: every edit checks whether it was already made.
set -e
[ -f src/auth/auth.module.ts ] && [ -f src/app.module.ts ] || { echo "Run day61-jwt-auth.sh first, inside day61/addis-eats-api/."; exit 1; }

node - << 'NODE'
const fs = require("fs");
let changed = 0;
const edit = (file, fn) => {
  const before = fs.readFileSync(file, "utf8");
  const after = fn(before);
  if (after !== before) { fs.writeFileSync(file, after); changed++; console.log("edited  " + file); }
  else console.log("already " + file);
};
const addImport = (text, line) => (text.includes(line.trim()) ? text : line + text);

// 1. AppModule: the JWT guard replaces the API-key guard, and the two new modules are imported
edit("src/app.module.ts", (t) => {
  t = t.replace('import { ApiKeyGuard } from "./common/guards/api-key.guard.js";\n', 'import { AuthModule } from "./auth/auth.module.js";\nimport { JwtAuthGuard } from "./auth/guards/jwt-auth.guard.js";\n');
  if (!t.includes("users.module.js")) t = t.replace('import { DebugModule }', 'import { UsersModule } from "./users/users.module.js";\nimport { DebugModule }');
  if (!t.includes("    AuthModule,\n")) t = t.replace("    OrdersModule,\n", "    UsersModule,\n    AuthModule,\n    OrdersModule,\n");
  return t
    .replace("ApiKeyGuard must run first, because it is what sets request.user.", "JwtAuthGuard must run first, because it is what sets request.user.")
    .replace("useClass: ApiKeyGuard", "useClass: JwtAuthGuard");
});

// 2. The exception filter: three new errors, three statuses
edit("src/common/filters/all-exceptions.filter.ts", (t) => {
  if (t.includes("InvalidCredentialsError")) return t;
  return t
    .replace('import { DishNotFoundError', 'import { InvalidCredentialsError, InvalidRefreshTokenError } from "../../auth/auth.errors.js";\nimport { EmailAlreadyRegisteredError } from "../../users/user.errors.js";\nimport { DishNotFoundError')
    .replace("  [PaymentDeclinedError, 402],\n", "  [PaymentDeclinedError, 402],\n  [InvalidCredentialsError, 401],\n  [InvalidRefreshTokenError, 401],\n  [EmailAlreadyRegisteredError, 409],\n");
});

// 3. Swagger: a bearer-token scheme instead of the API-key one
edit("src/config/swagger.setup.ts", (t) => {
  if (t.includes("addBearerAuth")) return t;
  return t
    .replace(/\*\*Staff routes\*\*.*?Everything else is open\.`;/s, () =>
      ("**Authentication:** register with `POST /auth/register`, log in with `POST /auth/login`, then click **Authorize** and paste the access token. Browsing restaurants, dishes and delivery fees is open. Everything else needs a token, and changing or cancelling an order needs the staff role.").replace(/`/g, "\\`") + "`;")
    .replace(/\.addApiKey\([\s\S]*?\n    \)\n/, '.addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "bearer")\n')
    .replace("the pasted key survives", "the pasted token survives");
});

// 4. The orders controller documents the bearer scheme
edit("src/orders/orders.controller.ts", (t) => t
  .replace("  ApiSecurity,\n", "  ApiBearerAuth,\n")
  .replaceAll('@ApiSecurity("x-api-key")', '@ApiBearerAuth("bearer")')
  .replaceAll('401: "No x-api-key header was sent."', '401: "Missing, invalid or expired access token."'));

// 5. Browsing stays open: @Public() on every GET of restaurants, dishes and delivery fees
for (const f of [
  "src/restaurants/restaurants.controller.ts",
  "src/dishes/dishes.controller.ts",
  "src/dishes/restaurant-dishes.controller.ts",
  "src/orders/delivery-fees.controller.ts",
]) {
  edit(f, (t) => {
    if (t.includes("public.decorator")) return t;
    return 'import { Public } from "../common/decorators/public.decorator.js";\n' + t.replace(/^(\s*)(@Get\()/gm, "$1@Public()\n$1$2");
  });
}

// 6. The written standard says what the code now does
edit("docs/api-standard.md", (t) => t
  .replace("`DELETE /orders/6` with no `x-api-key`", "`DELETE /orders/6` with no `Authorization` header, or an expired token")
  .replace("a wrong key, or the right key for the wrong role | `x-api-key: wrong`, or a customer key on a staff route", "the right token for the wrong role | a customer token on a staff route")
  .replace("- A caller identifies itself with the header `x-api-key`. The keys live in configuration (`.env`), never in code: one staff key and one customer key.", "- A caller identifies itself with `Authorization: Bearer <access token>`, obtained from `POST /auth/login`. The two JWT secrets live in configuration (`.env`), never in code. Every route needs a token except those marked `@Public()` (browsing restaurants, dishes and delivery fees, and the `/auth` routes that come before you have a token). Every failure to identify the caller is a 401; a known caller without the role is a 403.")
  .replace("The logger censors `authorization`, `x-api-key`, `cookie`", "The logger censors `authorization`, `cookie`"));

console.log(changed + " file(s) changed");
NODE

# the old key names are dead: remove them from .env.example and the logger's redaction list
[ -f .env.example ] && sed -i '/^STAFF_API_KEY=/d;/^CUSTOMER_API_KEY=/d' .env.example || true
sed -i '/x-api-key/d' src/config/logger.config.ts

echo
echo "Now: npx tsc --noEmit && npm run start:dev, then in another terminal: bash check-d61.sh"
