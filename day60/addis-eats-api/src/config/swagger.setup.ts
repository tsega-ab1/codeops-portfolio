import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { OpenAPIObject } from "@nestjs/swagger";

const DESCRIPTION = `Food delivery for Addis Ababa.

**Money is in santim, not birr.** 24000 santim is 240.00 ETB. Prices and totals are always whole numbers.
**Phone numbers are TeleBirr numbers:** \`09xxxxxxxx\` or \`+2519xxxxxxxx\`.

**Orders are priced by the server.** You send the lines (a dish and a quantity); the total is computed from the menu. Sending a \`totalSantim\` is rejected.

**Every error has the same five fields:** \`statusCode\`, \`message\`, \`path\`, \`timestamp\`, \`requestId\`. Quote the \`x-request-id\` response header (it is the same id) when you report a problem.
A request that takes longer than 5 seconds answers **408**, and an unexpected failure answers **500** with a generic message.

**Staff routes** (changing an order's status, cancelling an order) need the \`x-api-key\` header. Click **Authorize** and paste a staff key. Everything else is open.`;

// Builds the OpenAPI document. The page is served at /docs (and the raw JSON at /docs-json)
// everywhere EXCEPT production: it is a map of every endpoint and every rule, so it is not public.
export function setupSwagger(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle("Addis Eats API")
    .setDescription(DESCRIPTION)
    .setVersion("1.0")
    .addTag("restaurants", "Kitchens that take orders")
    .addTag("dishes", "Items on a restaurant menu")
    .addTag("orders", "Customer orders and their status")
    .addTag("delivery-fees", "What delivery costs in each area")
    .addApiKey(
      { type: "apiKey", name: "x-api-key", in: "header", description: "Staff key. Temporary until week 12." },
      "x-api-key", // the scheme name that @ApiSecurity("x-api-key") refers to
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  if (process.env.NODE_ENV !== "production") {
    SwaggerModule.setup("docs", app, document, {
      swaggerOptions: { persistAuthorization: true }, // the pasted key survives a refresh
    });
  }
  return document;
}
