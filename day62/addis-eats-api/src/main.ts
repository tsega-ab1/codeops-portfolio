import { writeFileSync } from "node:fs";
import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { EdgeValidationPipe } from "./common/pipes/edge-validation.pipe.js";
import { setupSwagger } from "./config/swagger.setup.js";

async function bootstrap(): Promise<void> {
  // bufferLogs: hold Nest's own startup lines until the structured logger is ready,
  // so even "Mapped {/api/v1/orders, GET}" is one JSON object
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

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
