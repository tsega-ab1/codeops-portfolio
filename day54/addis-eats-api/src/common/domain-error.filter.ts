import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { OrderNotFoundError } from "../orders/order.errors.js";

// Just the part of the HTTP response we use, so we need no `any`
interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

@Catch(OrderNotFoundError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: OrderNotFoundError, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<JsonResponse>()
      .status(404)
      .json({ statusCode: 404, message: error.message });
  }
}
