import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from "@nestjs/common";
import { Observable, TimeoutError, catchError, throwError, timeout } from "rxjs";

export const REQUEST_TIMEOUT_MS = 5000;

// A timeout stops the WAITING, not the work: the handler keeps running after this gives up.
// Fine on reads. Think hard before relying on it for writes.
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(REQUEST_TIMEOUT_MS),
      catchError((err: unknown) =>
        err instanceof TimeoutError
          ? throwError(() => new RequestTimeoutException()) // 408
          : throwError(() => err),
      ),
    );
  }
}
