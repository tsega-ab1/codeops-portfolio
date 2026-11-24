import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { OpenAPIObject } from "@nestjs/swagger";

const DESCRIPTION = `Food delivery for Addis Ababa.

**Money is in santim, not birr.** 24000 santim is 240.00 ETB. Prices and totals are always whole numbers.
**Phone numbers are TeleBirr numbers:** \`09xxxxxxxx\` or \`+2519xxxxxxxx\`.

**Orders are priced by the server.** You send the lines (a dish and a quantity); the total is computed from the menu. Sending a \`totalSantim\` is rejected.

**Every error has the same five fields:** \`statusCode\`, \`message\`, \`path\`, \`timestamp\`, \`requestId\`. Quote the \`x-request-id\` response header (it is the same id) when you report a problem.
A request that takes longer than 5 seconds answers **408**, and an unexpected failure answers **500** with a generic message.

**Authentication:** register with \`POST /auth/register\`, log in with \`POST /auth/login\`, then click **Authorize** and paste the access token. Browsing restaurants, dishes and delivery fees is open. Everything else needs a token, and changing or cancelling an order needs the staff role.`;

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
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "bearer")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  if (process.env.NODE_ENV !== "production") {
    SwaggerModule.setup("docs", app, document, {
      swaggerOptions: { persistAuthorization: true }, // the pasted token survives a refresh
    });
  }
  return document;
}
