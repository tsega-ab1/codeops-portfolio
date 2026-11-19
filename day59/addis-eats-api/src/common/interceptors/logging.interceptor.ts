import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

interface LoggedRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

// One log line per request: method, path, WHICH handler answered, outcome, duration, request id.
// A middleware sees only the URL; only an interceptor knows /orders/4 was OrdersController.findOne.
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<LoggedRequest>();
    const started = Date.now();
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    const id = req.headers["x-request-id"];

    // Log on success AND on failure: the slow failing endpoint is usually the one you care about
    return next.handle().pipe(
      tap({
        next: () => this.log(req, handler, id, started, "ok"),
        error: (e: unknown) =>
          this.log(req, handler, id, started, e instanceof Error ? e.name : "error"),
      }),
    );
  }

  private log(
    req: LoggedRequest,
    handler: string,
    id: string | string[] | undefined,
    started: number,
    outcome: string,
  ): void {
    const ms = Date.now() - started;
    this.logger.log(`${req.method} ${req.url} -> ${handler} ${outcome} ${ms}ms [${id}]`);
  }
}
