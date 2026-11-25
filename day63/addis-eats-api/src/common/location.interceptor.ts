import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

function readId(value: unknown): number | undefined {
  if (typeof value === "object" && value !== null && "id" in value) {
    const id = (value as { id: unknown }).id;
    if (typeof id === "number") return id;
  }
  return undefined;
}

@Injectable()
export class LocationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<{ originalUrl: string }>();
    const response = http.getResponse<{
      setHeader(name: string, value: string): void;
    }>();

    return next.handle().pipe(
      tap((created: unknown) => {
        const id = readId(created);
        if (id === undefined) return;
        const collection = request.originalUrl.split("?")[0].replace(/\/$/, "");
        response.setHeader("Location", `${collection}/${id}`);
      }),
    );
  }
}
