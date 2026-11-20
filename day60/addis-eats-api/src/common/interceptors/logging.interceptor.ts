import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";

interface RequestWithLogger {
  log?: { setBindings(bindings: Record<string, unknown>): void };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithLogger>();
    // a middleware sees only the URL; only an interceptor knows /orders/4 was OrdersController.findOne
    req.log?.setBindings({
      handler: `${context.getClass().name}.${context.getHandler().name}`,
    });
    return next.handle();
  }
}
