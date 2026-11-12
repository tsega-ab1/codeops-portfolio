import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { UnknownRestaurantError } from "../dishes/dish.errors.js";
import { DishNotFoundError } from "../dishes/dish.errors.js";
import { OrderNotFoundError } from "../orders/order.errors.js";
import { RestaurantNotFoundError } from "../restaurants/restaurant.errors.js";

// Just the part of the HTTP response we use, so we need no `any`
interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

// One place that turns domain errors into HTTP status codes
@Catch(
  OrderNotFoundError,
  RestaurantNotFoundError,
  DishNotFoundError,
  UnknownRestaurantError,
)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost): void {
    // A bad reference inside the request body is the caller's mistake: 400.
    // Asking for a record that is not there is: 404.
    const status = error instanceof UnknownRestaurantError ? 400 : 404;
    host
      .switchToHttp()
      .getResponse<JsonResponse>()
      .status(status)
      .json({ statusCode: status, message: error.message });
  }
}
