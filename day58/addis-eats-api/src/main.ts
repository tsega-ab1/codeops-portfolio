import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { EdgeValidationPipe } from "./common/pipes/edge-validation.pipe.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(new EdgeValidationPipe()); // stage 4: validate at the edge
  app.useGlobalFilters(new AllExceptionsFilter()); // stage 7: one shape for every failure

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
