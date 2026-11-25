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
