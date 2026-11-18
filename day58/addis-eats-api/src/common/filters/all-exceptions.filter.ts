import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { DishNotFoundError, DishNotOnMenuError } from "../../dishes/dish.errors.js";
import {
  InvalidTransitionError,
  OrderNotFoundError,
  PaymentDeclinedError,
} from "../../orders/order.errors.js";
import {
  RestaurantClosedError,
  RestaurantNotFoundError,
} from "../../restaurants/restaurant.errors.js";

// Just the parts of the HTTP objects we use, so we need no `any`
interface HttpResponse {
  status(code: number): { json(body: unknown): void };
}
interface HttpRequest {
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

// THE ERROR CONTRACT, as code. docs/api-standard.md says the same thing in prose.
// When a domain error is added, exactly two places change: this table and that page.
const STATUS_BY_ERROR: ReadonlyArray<readonly [new (...args: never[]) => Error, number]> = [
  [OrderNotFoundError, 404],
  [RestaurantNotFoundError, 404],
  [DishNotFoundError, 404],
  [InvalidTransitionError, 409],
  [RestaurantClosedError, 409],
  [DishNotOnMenuError, 422],
  [PaymentDeclinedError, 402],
];

@Catch() // no argument = everything, including errors nobody wrote a class for
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<HttpResponse>();
    const req = http.getRequest<HttpRequest>();

    const { status, message } = this.translate(exception);

    // Only OUR bugs are logged as errors: the detail goes to the log, never to the client
    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // Five fields on every error, whatever went wrong
    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
      requestId: this.requestId(req),
    });
  }

  private translate(e: unknown): { status: number; message: unknown } {
    // 1 - Nest's own exceptions (validation, ParseIntPipe, unknown route) already carry a status
    if (e instanceof HttpException) {
      const body = e.getResponse();
      const message =
        typeof body === "object" && body !== null && "message" in body
          ? (body as { message: unknown }).message
          : e.message;
      return { status: e.getStatus(), message };
    }

    // 2 - our domain errors
    for (const [type, status] of STATUS_BY_ERROR) {
      if (e instanceof type) return { status, message: e.message };
    }

    // 3 - anything else is OUR bug, and the client learns nothing about it
    return { status: 500, message: "Internal server error" };
  }

  private requestId(req: HttpRequest): string | null {
    const header = req.headers["x-request-id"];
    return (Array.isArray(header) ? header[0] : header) ?? null;
  }
}
