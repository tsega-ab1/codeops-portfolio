import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";
import { STORAGE } from "../storage/storage.service.js";
import type { StorageService } from "../storage/storage.service.js";
import type { StoredImage } from "./image.types.js";

type WithImage = { image?: StoredImage };

// The database keeps KEYS. The URL is built here, at read time, so changing bucket, region, provider or CDN changes one line
// and not every row. A record with no image answers imageUrl: null (never a missing property: a frontend must not crash on it).
@Injectable()
export class ImageViewInterceptor implements NestInterceptor {
  constructor(@Inject(STORAGE) private readonly storage: StorageService) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data: unknown) => this.present(data)));
  }

  private present(data: unknown): unknown {
    if (Array.isArray(data)) return data.map((item) => this.present(item));
    if (typeof data !== "object" || data === null) return data;
    if ("items" in data && Array.isArray((data as { items: unknown }).items)) {
      return { ...data, items: (data as { items: unknown[] }).items.map((item) => this.present(item)) };
    }
    if (!("id" in data)) return data;
    const { image, ...rest } = data as WithImage & Record<string, unknown>;
    return {
      ...rest,
      imageUrl: image ? this.storage.urlFor(image.key) : null,
      thumbUrl: image ? this.storage.urlFor(image.thumbKey) : null,
      imageName: image ? image.originalName : null,
    };
  }
}
