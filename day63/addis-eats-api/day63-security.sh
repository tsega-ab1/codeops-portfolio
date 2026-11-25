#!/usr/bin/env bash
# Day 63 - API security, on top of Day 62.
# Run it from INSIDE day63/addis-eats-api/ (a copy of day62/addis-eats-api):   bash day63-security.sh
set -e
[ -f src/common/policies/order.policy.ts ] && [ -f src/main.ts ] || { echo "Run this inside day63/addis-eats-api (a copy of Day 62)."; exit 1; }
mkdir -p src/health src/config src/common/validators

echo "installing helmet and @nestjs/throttler..."
npm install helmet @nestjs/throttler --no-audit --no-fund > /dev/null 2>&1 || { echo "npm install failed: are you online?"; exit 1; }

# ------------------------------------------------------------------ 1. settings that belong in configuration
cat > src/config/security.config.ts << 'EOF'
// Security settings come from the environment (validated at startup in validate-env.ts), never from the source.

// A whole number from an env var, or the fallback. Read at request time, so a .env change needs only a restart.
export function envInt(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

// The origins a browser may call this API from. An exact list, never "*".
// In development a Vite/React frontend is allowed by default; in production nothing is unless CORS_ORIGINS says so.
export function corsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env["CORS_ORIGINS"];
  if (raw !== undefined && raw.trim() !== "") return raw.split(",").map((o) => o.trim());
  return env["NODE_ENV"] === "production" ? [] : ["http://localhost:5173", "http://localhost:3001"];
}
EOF

cat > src/common/validators/name.pattern.ts << 'EOF'
// What a person's or a place's name may contain: letters in ANY script (Amharic included), digits, spaces and . , ' ’ & ( ) -
// It must START with a letter or digit. No < > " / = or backticks: that is the constraint that stops a stored <script>.
// The API constrains what it accepts and stores what was sent; it does NOT HTML-escape (that corrupts the data for
// every other consumer). Encoding for HTML is the frontend's job.
export const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .,'’&()-]*$/u;
export const NAME_MESSAGE = "must contain only letters, digits, spaces and . , ' & ( ) -";
EOF

node - << 'NODE'
const fs = require("fs");
const edit = (f, fn) => { const t = fs.readFileSync(f, "utf8"); const r = fn(t); fs.writeFileSync(f, r); console.log(r === t ? "already " + f : "edited  " + f); };

edit("src/config/validate-env.ts", (t) => t.includes("CORS_ORIGINS") ? t : t.replace('  if (env["NODE_ENV"] !== "production") {', `  // CORS: an exact list of origins like https://addiseats.et. A wildcard is refused here, at startup.
  const origins = env["CORS_ORIGINS"];
  if (typeof origins === "string" && origins.trim() !== "") {
    for (const origin of origins.split(",").map((o) => o.trim())) {
      if (!/^https?:\\/\\/[^/\\s*]+$/.test(origin)) {
        throw new Error(\`CORS_ORIGINS must be a comma-separated list of exact origins such as https://addiseats.et (no *, no path, no trailing slash). Got: "\${origin}"\`);
      }
    }
  }

  for (const name of ["THROTTLE_LIMIT", "THROTTLE_STRICT_LIMIT", "THROTTLE_REGISTER_LIMIT"]) {
    const value = env[name];
    if (value !== undefined && value !== "" && !/^[1-9]\\d*$/.test(String(value))) {
      throw new Error(\`\${name} must be a positive whole number.\`);
    }
  }

  if (env["NODE_ENV"] !== "production") {`));

// ------------------------------------------------------------------ 2. one filter, every failure: body-parser errors too
edit("src/common/filters/all-exceptions.filter.ts", (t) => t.includes("isClientHttpError") ? t : t
  .replace("@Catch() // no argument", `// The body parser (and anything built on the http-errors package) throws plain Errors that carry a status.
// A 413 or a malformed-JSON 400 is the CLIENT's mistake, so it must not be reported as our bug.
function isClientHttpError(e: unknown): e is { status: number } {
  return (
    typeof e === "object" && e !== null &&
    "status" in e && typeof (e as { status: unknown }).status === "number" &&
    (e as { status: number }).status >= 400 && (e as { status: number }).status < 500 &&
    "expose" in e && (e as { expose: unknown }).expose === true
  );
}

const CLIENT_MESSAGES: Readonly<Record<number, string>> = {
  400: "Malformed request body",
  413: "Request body is too large (the limit is 100 kb)",
  415: "Unsupported content type",
};

@Catch() // no argument`)
  .replace("    // 3 - anything else is OUR bug", `    // 3 - the body parser's own client errors: 413 too large, 400 malformed JSON
    if (isClientHttpError(e)) return { status: e.status, message: CLIENT_MESSAGES[e.status] ?? "Bad request" };

    // 4 - anything else is OUR bug`));

// ------------------------------------------------------------------ 3. name rules, and explicit assignment in every create
edit("src/restaurants/dto/create-restaurant.dto.ts", (t) => t.includes("NAME_PATTERN") ? t : t
  .replace('import { IsBoolean, IsIn, IsOptional, IsString, Length } from "class-validator";', 'import { IsBoolean, IsIn, IsOptional, IsString, Length, Matches } from "class-validator";')
  .replace('import { AREAS } from', 'import { NAME_MESSAGE, NAME_PATTERN } from "../../common/validators/name.pattern.js";\nimport { AREAS } from')
  .replace("  @Length(2, 80)\n  name!: string;", "  @Length(2, 80)\n  @Matches(NAME_PATTERN, { message: `name ${NAME_MESSAGE}` })\n  name!: string;"));

edit("src/dishes/dto/create-dish.dto.ts", (t) => t.includes("NAME_PATTERN") ? t : t
  .replace('import { IsInt, IsNotEmpty, IsString, Min, Validate } from "class-validator";', 'import { IsInt, IsNotEmpty, IsString, Length, Matches, Min, Validate } from "class-validator";')
  .replace('import { IsSantimConstraint }', 'import { NAME_MESSAGE, NAME_PATTERN } from "../../common/validators/name.pattern.js";\nimport { IsSantimConstraint }')
  .replace("  @IsNotEmpty()\n  name!: string;", "  @IsNotEmpty()\n  @Length(2, 80)\n  @Matches(NAME_PATTERN, { message: `name ${NAME_MESSAGE}` })\n  name!: string;"));

edit("src/orders/dto/create-order.dto.ts", (t) => t.includes("NAME_PATTERN") ? t : t
  .replace("  @Length(2, 80)\n  customer!: string;", "  @Length(2, 80)\n  @Matches(NAME_PATTERN, { message: `customer ${NAME_MESSAGE}` })\n  customer!: string;")
  .replace("  Length,\n  Max,", "  Length,\n  Matches,\n  Max,")
  .replace('import { IsTeleBirrNumber }', 'import { NAME_MESSAGE, NAME_PATTERN } from "../../common/validators/name.pattern.js";\nimport { IsTeleBirrNumber }'));

edit("src/restaurants/restaurants.service.ts", (t) => t.replace("return this.repo.save({ ...dto, id, isOpen: dto.isOpen ?? true });", "// every field by NAME: a spread would let any extra property in the body become part of the record\n    return this.repo.save({ id, name: dto.name, area: dto.area, isOpen: dto.isOpen ?? true });"));
edit("src/dishes/dishes.service.ts", (t) => t.replace("return this.repo.save({ ...dto, id });", "// every field by NAME: a spread would let any extra property in the body become part of the record\n    return this.repo.save({ id, name: dto.name, priceSantim: dto.priceSantim, restaurantId: dto.restaurantId });"));

// ------------------------------------------------------------------ 4. rate limits on the three sensitive flows
edit("src/auth/auth.controller.ts", (t) => t.includes("Throttle") ? t : t
  .replace('import { ApiBearerAuth,', 'import { ApiBearerAuth,')
  .replace('import type { AuthenticatedUser }', 'import { Throttle } from "@nestjs/throttler";\nimport type { AuthenticatedUser }')
  .replace('import { ApiErrors }', 'import { envInt } from "../config/security.config.js";\nimport { ApiErrors }')
  .replace('  @Public() // you cannot have a token before you have registered\n  @Post("register")', '  @Public() // you cannot have a token before you have registered\n  @Throttle({ default: { limit: () => envInt("THROTTLE_REGISTER_LIMIT", 3), ttl: 3_600_000 } }) // 3 accounts per hour per address\n  @Post("register")')
  .replace('  @Public()\n  @Post("login")', '  @Public()\n  @Throttle({ default: { limit: () => envInt("THROTTLE_STRICT_LIMIT", 5), ttl: 900_000 } }) // 5 attempts per 15 minutes per address\n  @Post("login")')
  .replace('  @Public() // the access token has just expired: the refresh token is the proof\n  @Post("refresh")', '  @Public() // the access token has just expired: the refresh token is the proof\n  @Throttle({ default: { limit: () => envInt("THROTTLE_STRICT_LIMIT", 5), ttl: 900_000 } })\n  @Post("refresh")')
  .replace('    409: "That email is already registered.",\n  })', '    409: "That email is already registered.",\n    429: "Too many accounts created from this address. Wait the number of seconds in the Retry-After header.",\n  })')
  .replace('(unknown email or wrong password: deliberately indistinguishable).",\n  })', '(unknown email or wrong password: deliberately indistinguishable).",\n    429: "Too many attempts from this address. Wait the number of seconds in the Retry-After header.",\n  })')
  .replace('or is really an access token.",\n  })', 'or is really an access token.",\n    429: "Too many attempts from this address. Wait the number of seconds in the Retry-After header.",\n  })'));

// the throttler guard FIRST: a flood is refused before a token is even verified
edit("src/app.module.ts", (t) => t.includes("ThrottlerModule") ? t : t
  .replace('import { MiddlewareConsumer,', 'import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";\nimport { MiddlewareConsumer,')
  .replace('import { DebugModule }', 'import { HealthModule } from "./health/health.module.js";\nimport { DebugModule }')
  .replace("    UsersModule,\n    AuthModule,", `    // ONE named throttler, "default": every route gets it, and @Throttle on a route REPLACES its numbers.
    // (Two named throttlers would BOTH apply to every route, and the strict one would throttle the whole API.)
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        errorMessage: "Too many requests", // the filter puts this in Day 58's five-field body
        throttlers: [{ name: "default", ttl: 60_000, limit: Number(config.get("THROTTLE_LIMIT") ?? 600) }],
      }),
    }),
    HealthModule,
    UsersModule,
    AuthModule,`)
  .replace("    { provide: APP_GUARD, useClass: JwtAuthGuard },", "    { provide: APP_GUARD, useClass: ThrottlerGuard }, // first: refuse a flood before verifying a single token\n    { provide: APP_GUARD, useClass: JwtAuthGuard },")
  .replace("Order matters: JwtAuthGuard must run first, because it is what sets request.user.", "Order matters: ThrottlerGuard, then JwtAuthGuard (it sets request.user), then RolesGuard (it reads it)."));

// ------------------------------------------------------------------ 5. a debug route that proves the filter hides 500s
edit("src/debug/debug.controller.ts", (t) => t.includes("boom") ? t : t.replace(/\n}\s*$/, `

  // GET /api/v1/debug/boom  ->  a deliberate bug, to prove a 500 tells the client nothing (Day 63, attack 10).
  // DebugModule is not mounted when NODE_ENV=production, so this route does not exist there.
  @Get("boom")
  @Roles("staff")
  boom(): never {
    throw new Error("deliberate failure: the secret detail that must never reach the client");
  }
}
`));

// ------------------------------------------------------------------ 6. the dev server for the regression suites
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.scripts["start:dev:relaxed"] = "THROTTLE_STRICT_LIMIT=10000 THROTTLE_REGISTER_LIMIT=10000 nest start --watch";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("edited  package.json (start:dev:relaxed)");
NODE

# ------------------------------------------------------------------ 7. the health check (never rate limited)
cat > src/health/health.controller.ts << 'EOF'
import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../common/decorators/public.decorator.js";
import { ApiErrors } from "../common/swagger/api-errors.decorator.js";

class HealthResponse {
  @ApiProperty({ example: true })
  ok!: boolean;
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  // A load balancer polls this every few seconds from ONE address. Rate-limit it and the platform decides the
  // API is down and takes it out of rotation: a common outage. So: public, and never throttled.
  @Public()
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: "Is the API up?", description: "Never rate limited and never needs a token: a load balancer polls it." })
  @ApiOkResponse({ type: HealthResponse })
  @ApiErrors({ 408: "The handler took longer than 5 seconds (the global timeout from Day 59): the API is up but not answering in time." })
  check(): HealthResponse {
    return { ok: true };
  }
}
EOF
cat > src/health/health.module.ts << 'EOF'
import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller.js";

@Module({ controllers: [HealthController] })
export class HealthModule {}
EOF

# ------------------------------------------------------------------ 8. main.ts: helmet, CORS, body limit, request id before the parser
cat > src/main.ts << 'EOF'
import { writeFileSync } from "node:fs";
import { VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware.js";
import { EdgeValidationPipe } from "./common/pipes/edge-validation.pipe.js";
import { corsOrigins } from "./config/security.config.js";
import { setupSwagger } from "./config/swagger.setup.js";

async function bootstrap(): Promise<void> {
  // bufferLogs: hold Nest's own startup lines until the structured logger is ready,
  // so even "Mapped {/api/v1/orders, GET}" is one JSON object.
  // bodyParser: false because we register the parsers ourselves below, with a size limit.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true, bodyParser: false });
  app.useLogger(app.get(Logger));
  const config = app.get(ConfigService);

  // 0 - a request id BEFORE anything can fail, so even a 413 from the body parser can be quoted and traced
  const requestId = new RequestIdMiddleware();
  app.use((req: Parameters<RequestIdMiddleware["use"]>[0], res: Parameters<RequestIdMiddleware["use"]>[1], next: Parameters<RequestIdMiddleware["use"]>[2]) => requestId.use(req, res, next));

  // 1 - security headers. An API that returns JSON needs a MUCH stricter Content-Security-Policy than helmet's
  // default (which assumes a server that renders HTML): nothing may load, nothing may frame it.
  const apiHeaders = helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"], formAction: ["'none'"] } },
  });
  // Swagger UI needs inline scripts and styles, so /docs (which does not exist in production) gets helmet without a CSP
  const docsHeaders = helmet({ contentSecurityPolicy: false });
  app.use((req: { path: string }, res: unknown, next: () => void) =>
    (req.path.startsWith("/docs") ? docsHeaders : apiHeaders)(req as never, res as never, next));

  // 2 - CORS: an explicit origin list from CORS_ORIGINS. credentials stays false on purpose: this API reads a Bearer
  // token from a header, not a cookie, and credentials: true is only for cookies. Never "*" on an authenticated API.
  const origins = corsOrigins({ ...process.env, CORS_ORIGINS: config.get<string>("CORS_ORIGINS") });
  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    credentials: false,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id", "Retry-After", "Location"], // a browser may only READ the headers named here
    maxAge: 86_400, // cache the preflight for a day
  });

  // 3 - a body limit: nobody needs to POST megabytes of JSON to an order API (API4)
  app.useBodyParser("json", { limit: "100kb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "100kb" });

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(new EdgeValidationPipe()); // stage 4: validate at the edge
  app.useGlobalFilters(new AllExceptionsFilter()); // stage 7: one shape for every failure

  const document = setupSwagger(app);

  // npm run export:openapi  ->  writes openapi.json and exits without listening
  if (process.env.EXPORT_OPENAPI) {
    writeFileSync("openapi.json", JSON.stringify(document, null, 2) + "\n");
    await app.close();
    return;
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
EOF

# ------------------------------------------------------------------ 9. .env.example and the written standard
cat >> .env.example << 'EOF'

# CORS: the browser origins allowed to call this API, comma separated, exact, never *.
# Unset in development = http://localhost:5173 and http://localhost:3001. Unset in production = none.
# CORS_ORIGINS=https://addiseats.et,https://kitchen.addiseats.et

# Rate limits (all optional). Defaults: 600 requests a minute per address and route; login and refresh 5 per
# 15 minutes; registration 3 per hour. Keep the strict ones low in production.
# THROTTLE_LIMIT=600
# THROTTLE_STRICT_LIMIT=5
# THROTTLE_REGISTER_LIMIT=3
EOF

node - << 'NODE'
const fs = require("fs");
let t = fs.readFileSync("docs/api-standard.md", "utf8");
if (!t.includes("## 10. Security configuration")) {
  t = t.trimEnd() + `

## 10. Security configuration (Day 63)

- **Headers:** \`helmet()\` on every response, with a strict JSON-API Content-Security-Policy (\`default-src 'none'\`, no framing). \`X-Powered-By\` is removed. Only \`/docs\` (never mounted in production) has a looser policy, because Swagger UI needs inline scripts.
- **CORS:** an exact origin list from \`CORS_ORIGINS\`, never \`*\`; a wildcard stops the app at startup. \`credentials\` is **false** because the API authenticates with an \`Authorization\` header, not a cookie. CORS is a browser control, not access control: guards and policies run for every caller.
- **Rate limits** (per address, in memory until Module 7 adds Redis): 600 requests a minute per route for everything, **5 per 15 minutes on login and refresh, 3 per hour on registration**, and \`/health\` is never limited. A refusal is **429**, in the five-field error shape, with \`Retry-After\` (seconds).
- **Body size:** JSON and form bodies are limited to 100 kb. Too large is **413**; malformed JSON is **400**. Neither is ever a 500.
- **Mass assignment:** \`forbidNonWhitelisted\` on every write, and every create assigns its fields by name. A request body is never spread into a record.
- **Names:** restaurant, dish and customer names accept letters (any script), digits, spaces and \`. , ' & ( ) -\`. The API constrains input and stores what was sent; it does not HTML-escape. Encoding for HTML is the frontend's job.
- **Nothing extra in production:** no \`/docs\`, no \`/debug\` routes, no development users.
`;
  fs.writeFileSync("docs/api-standard.md", t); console.log("edited  docs/api-standard.md");
}
NODE

# the old regression scripts log in many times: tell people why a 429 is not a bug
for f in check-d59.sh check-d62.sh; do
  [ -f "$f" ] && sed -i 's#Could not log in: is the server running, and is SEED_PASSWORD in .env?#Could not log in: is the server running, is SEED_PASSWORD in .env, or is the login rate limit hit? (restart the server, or run npm run start:dev:relaxed)#' "$f"
done

echo
echo "Done. Next:  npx tsc --noEmit && npm test && npm run start:dev:relaxed"
echo "Then, in another terminal:  bash check-d62.sh && bash check-d61.sh && bash check-d59.sh && bash run-all.sh"
echo "And the attack list (it starts its own servers):  bash attack.sh --write"
