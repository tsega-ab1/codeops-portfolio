import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";

interface RequestWithLogger {
  handlerName?: string;
  log?: { setBindings(bindings: Record<string, unknown>): void };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithLogger>();
    // a middleware sees only the URL; only an interceptor knows /orders/4 was OrdersController.findOne
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    req.handlerName = handler; // for the final "request completed" line (see logger.config.ts)
    req.log?.setBindings({ handler }); // for every line written while the request is running
    return next.handle();
  }
}
