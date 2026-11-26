#!/usr/bin/env bash
# Day 64 - File uploads (restaurant and dish images), on top of Day 63.
# Run it from INSIDE day64/addis-eats-api/ (a copy of day63/addis-eats-api):   bash day64-uploads.sh
set -e
[ -f src/common/policies/order.policy.ts ] && [ -f src/health/health.controller.ts ] || { echo "Run this inside day64/addis-eats-api (a copy of Day 63, with the audit fixes applied)."; exit 1; }
mkdir -p src/common/storage src/common/images scripts

echo "installing sharp and @types/multer..."
# sharp 0.35 changed its package layout (ESM-first typings); 0.34 matches this CommonJS project
npm install "sharp@^0.34" --no-audit --no-fund > /dev/null 2>&1 || { echo "npm install sharp failed: are you online?"; exit 1; }
npm install -D @types/multer --no-audit --no-fund > /dev/null 2>&1 || { echo "npm install @types/multer failed"; exit 1; }

# ------------------------------------------------------------------ 1. storage behind an interface (the Day 55 trick, third time)
cat > src/common/storage/storage.service.ts << 'EOF'
// Three methods are the WHOLE interface: put it somewhere, remove it, tell me its URL.
// Everything else an S3 client offers is detail the services must never see: that is what keeps the Module 7 swap to one line.
export const STORAGE = Symbol("STORAGE");

export interface StorageService {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  urlFor(key: string): string;
}
EOF

cat > src/common/storage/local-storage.service.ts << 'EOF'
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { Injectable } from "@nestjs/common";
import { uploadRoot } from "../../config/storage.config.js";
import type { StorageService } from "./storage.service.js";

// Local disk: simplest possible, and a TRAP in a container (every upload is gone at the next restart). It sits behind the
// StorageService interface so Module 7 can replace it with object storage by changing one line in StorageModule.
@Injectable()
export class LocalStorageService implements StorageService {
  readonly root = uploadRoot();

  async put(key: string, body: Buffer, _contentType: string): Promise<void> {
    const full = this.resolveInside(key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, body);
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolveInside(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; // already gone is fine
    }
  }

  urlFor(key: string): string {
    this.resolveInside(key); // refuse to build a URL for a key that could not be stored
    return `/static/${key}`;
  }

  // Check the RESOLVED path, not the input: even with a generated name, assert that the file lands inside the root.
  // Path traversal is the one bug on Day 64's list that turns an image upload into a compromised server.
  private resolveInside(key: string): string {
    const full = resolve(this.root, key);
    const rel = relative(this.root, full);
    if (key === "" || rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
      throw new Error(`Refusing a storage key that escapes the upload directory: ${JSON.stringify(key)}`);
    }
    return full;
  }
}
EOF

cat > src/common/storage/storage.module.ts << 'EOF'
import { Global, Module } from "@nestjs/common";
import { ImageService } from "../images/image.service.js";
import { LocalStorageService } from "./local-storage.service.js";
import { STORAGE } from "./storage.service.js";

// THE line Module 7 changes:  useClass: LocalStorageService  ->  useClass: S3StorageService
@Global()
@Module({
  providers: [{ provide: STORAGE, useClass: LocalStorageService }, ImageService],
  exports: [STORAGE, ImageService],
})
export class StorageModule {}
EOF

cat > src/config/storage.config.ts << 'EOF'
import { resolve } from "node:path";

// Where uploaded files live on disk. A setting, not a constant: Module 7 mounts a volume here (and then replaces it with object storage).
export function uploadRoot(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env["UPLOAD_DIR"];
  return resolve(configured !== undefined && configured.trim() !== "" ? configured : "uploads");
}
EOF

# ------------------------------------------------------------------ 2. the image pipeline
cat > src/common/images/image.types.ts << 'EOF'
// What the database keeps about an image (never a URL: the URL embeds a provider you will change).
export interface StoredImage {
  key: string; // restaurants/3f7a....webp : location-independent
  thumbKey: string; // restaurants/3f7a....-thumb.webp
  originalName: string; // only a label for people, NEVER a path segment
  detectedType: string; // what the BYTES were (image/jpeg), not what the caller claimed
  contentType: string; // what we stored: always image/webp
  size: number; // bytes of the full image
  thumbSize: number;
}
EOF

cat > src/common/images/detect-image-type.ts << 'EOF'
// A magic-number check: read the first bytes, because the filename and the Content-Type are strings the caller typed.
// Only three formats are accepted, so three signatures are the whole check. (The file-type package would do this for hundreds
// of formats, but it is ESM-only since v17 and parses far more than we ever accept; sharp then decodes the whole file anyway.)
export interface DetectedImage {
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
}

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WEBP = [0x57, 0x45, 0x42, 0x50]; // "WEBP", at byte 8

const at = (buffer: Buffer, bytes: readonly number[], offset = 0): boolean =>
  buffer.length >= offset + bytes.length && bytes.every((byte, i) => buffer[offset + i] === byte);

export function detectImageType(buffer: Buffer): DetectedImage | undefined {
  if (at(buffer, JPEG)) return { mime: "image/jpeg", ext: "jpg" };
  if (at(buffer, PNG)) return { mime: "image/png", ext: "png" };
  if (at(buffer, RIFF) && at(buffer, WEBP, 8)) return { mime: "image/webp", ext: "webp" };
  return undefined;
}
EOF

cat > src/common/images/image.service.ts << 'EOF'
import { randomUUID } from "node:crypto";
import { Inject, Injectable, UnprocessableEntityException } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import sharp = require("sharp");
import { STORAGE } from "../storage/storage.service.js";
import type { StorageService } from "../storage/storage.service.js";
import { detectImageType } from "./detect-image-type.js";
import type { StoredImage } from "./image.types.js";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB: what makes memory storage a defensible choice
const MAX_PIXELS = 50_000_000; // a 2 MB PNG can decode to gigabytes: refuse before decoding

// The original filename is a LABEL: strip any path and control characters, cap the length, and never build a path from it.
function cleanName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 100);
  return cleaned === "" ? "image" : cleaned;
}

@Injectable()
export class ImageService {
  constructor(
    @Inject(STORAGE) private readonly storage: StorageService,
    @InjectPinoLogger(ImageService.name) private readonly logger: PinoLogger,
  ) {}

  // Steps 6 and 7 of the pipeline: read the BYTES, then re-encode. Re-encoding is a security control: sharp decodes the pixels and
  // writes a NEW file, so whatever was hidden in the original (metadata, a payload, an old-decoder exploit) does not survive,
  // and neither does the EXIF with its GPS position.
  async process(file: Express.Multer.File): Promise<{ full: Buffer; thumb: Buffer; detectedType: string }> {
    const detected = detectImageType(file.buffer);
    if (!detected) throw new UnprocessableEntityException("Only JPEG, PNG and WebP images are accepted");

    try {
      const open = () => sharp(file.buffer, { limitInputPixels: MAX_PIXELS }).rotate(); // honour EXIF orientation, then drop the EXIF
      const [full, thumb] = await Promise.all([
        open().resize(1200, 800, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
        open().resize(320, 240, { fit: "cover" }).webp({ quality: 70 }).toBuffer(),
      ]);
      return { full, thumb, detectedType: detected.mime };
    } catch {
      throw new UnprocessableEntityException("The image could not be read: it may be corrupt, or far too large in pixels");
    }
  }

  // The ordering that FAILS SAFE (there is no transaction across a filesystem and a database):
  //   store the new files -> save the record -> only THEN delete the old files (best effort).
  // If the save fails, the new files are deleted again. An orphaned file costs a fraction of a cent; a row pointing at bytes
  // that do not exist is a broken page.
  async attach(
    file: Express.Multer.File,
    folder: string,
    current: StoredImage | undefined,
    persist: (image: StoredImage) => void,
  ): Promise<StoredImage> {
    const { full, thumb, detectedType } = await this.process(file);

    const id = randomUUID(); // the stored name has no relationship to the input at all
    const image: StoredImage = {
      key: `${folder}/${id}.webp`,
      thumbKey: `${folder}/${id}-thumb.webp`,
      originalName: cleanName(file.originalname),
      detectedType,
      contentType: "image/webp",
      size: full.length,
      thumbSize: thumb.length,
    };

    try {
      await this.storage.put(image.key, full, image.contentType);
      await this.storage.put(image.thumbKey, thumb, image.contentType);
      persist(image);
    } catch (error) {
      await this.discard(image); // roll back whatever was stored
      throw error;
    }

    if (current) await this.discard(current); // the replaced pair
    return image;
  }

  async discard(image: StoredImage): Promise<void> {
    for (const key of [image.key, image.thumbKey]) {
      try {
        await this.storage.delete(key);
      } catch (error) {
        // never fail a request over cleanup: log it, and a periodic sweep (Day 68) collects what is left
        this.logger.warn({ key, err: error }, "could not delete a stored file: it is now an orphan");
      }
    }
  }
}
EOF

cat > src/common/images/parse-image-file.pipe.ts << 'EOF'
import { FileTypeValidator, HttpStatus, MaxFileSizeValidator, ParseFilePipe } from "@nestjs/common";
import { MAX_IMAGE_BYTES } from "./image.service.js";

// The POLITE half: a clear error for the honest mistake (a customer picked a PDF), and it fails fast before the service runs.
// FileTypeValidator checks file.mimetype, which is a string the CALLER typed: it is a convenience, not a security control.
// The real check is detectImageType() on the bytes, inside ImageService.
// fileIsRequired is false so that a request with NO file is a 400 from the controller (a malformed request), while
// a file that is the WRONG KIND is a 422 from here (a well-formed request whose content is not acceptable).
export const imageFilePipe = (): ParseFilePipe =>
  new ParseFilePipe({
    fileIsRequired: false,
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    validators: [
      new MaxFileSizeValidator({ maxSize: MAX_IMAGE_BYTES }),
      new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
    ],
  });
EOF

cat > src/common/images/image-view.interceptor.ts << 'EOF'
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
EOF

# ------------------------------------------------------------------ 3. who may manage a menu (the Day 62 DishPolicy homework, now needed)
cat > src/common/policies/menu.policy.ts << 'EOF'
import { Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.types.js";

// Staff manage every menu. The restaurant role manages ONLY its own: the user's restaurantId (carried in the token since
// Day 64, as a snapshot like the roles) must equal the restaurant the dish or image belongs to.
// Like OrderPolicy it returns a boolean and throws nothing. A menu is public, so a refusal is 403, not 404: nothing is being hidden.
@Injectable()
export class MenuPolicy {
  canManage(user: AuthenticatedUser, restaurantId: number): boolean {
    if (user.roles.includes("staff")) return true;
    return user.roles.includes("restaurant") && user.restaurantId !== undefined && user.restaurantId === restaurantId;
  }
}
EOF

cat > src/common/guards/restaurant-manage.guard.ts << 'EOF'
import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { AuthRequest } from "../auth/auth.types.js";
import { MenuPolicy } from "../policies/menu.policy.js";
import { RestaurantsService } from "../../restaurants/restaurants.service.js";

// Runs AFTER JwtAuthGuard and RolesGuard and BEFORE the upload interceptor: a caller who may not manage this restaurant
// is refused before a single byte of a 2 MB body is read.
@Injectable()
export class RestaurantManageGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(RestaurantManageGuard.name) private readonly logger: PinoLogger,
    private readonly restaurants: RestaurantsService,
    private readonly policy: MenuPolicy,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest & { params: Record<string, string> }>();
    const user = req.user;
    if (!user) return false;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new BadRequestException("Validation failed (numeric string is expected)");

    const restaurant = this.restaurants.findOne(id); // a restaurant that does not exist is a 404 for everybody
    if (!this.policy.canManage(user, restaurant.id)) {
      this.logger.warn({ userId: user.id, restaurantId: id }, "access refused: not this user's restaurant");
      throw new ForbiddenException("You may only manage your own restaurant");
    }
    return true;
  }
}
EOF

cat > src/common/guards/dish-manage.guard.ts << 'EOF'
import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { AuthRequest } from "../auth/auth.types.js";
import { MenuPolicy } from "../policies/menu.policy.js";
import { DishesService } from "../../dishes/dishes.service.js";

// The same decision for a dish: it belongs to a restaurant, and only that restaurant's users (or staff) may manage it.
@Injectable()
export class DishManageGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(DishManageGuard.name) private readonly logger: PinoLogger,
    private readonly dishes: DishesService,
    private readonly policy: MenuPolicy,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest & { params: Record<string, string> }>();
    const user = req.user;
    if (!user) return false;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new BadRequestException("Validation failed (numeric string is expected)");

    const dish = this.dishes.findOne(id); // 404 if the dish does not exist
    if (!this.policy.canManage(user, dish.restaurantId)) {
      this.logger.warn({ userId: user.id, dishId: id, restaurantId: dish.restaurantId }, "access refused: not this user's menu");
      throw new ForbiddenException("You may only manage dishes on your own restaurant's menu");
    }
    return true;
  }
}
EOF

# ------------------------------------------------------------------ 4. the token now says which restaurant a user belongs to
node - << 'NODE'
const fs = require("fs");
const edit = (f, fn) => { const t = fs.readFileSync(f, "utf8"); const r = fn(t); fs.writeFileSync(f, r); console.log(r === t ? "already " + f : "edited  " + f); };

edit("src/common/auth/auth.types.ts", (t) => t.includes("restaurantId") ? t : t.replace("  roles: Role[];\n}", "  roles: Role[];\n  restaurantId?: number; // only for the restaurant role: whose menu it may manage (a snapshot, like the roles)\n}"));
edit("src/auth/auth.types.ts", (t) => t.includes("restaurantId") ? t : t.replace("  roles: Role[];\n}", "  roles: Role[];\n  restaurantId?: number;\n}"));
edit("src/auth/strategies/jwt.strategy.ts", (t) => t.includes("restaurantId") ? t : t.replace("    return { id: Number(payload.sub), email: payload.email, roles: payload.roles };",
  "    return {\n      id: Number(payload.sub),\n      email: payload.email,\n      roles: payload.roles,\n      ...(payload.restaurantId !== undefined ? { restaurantId: payload.restaurantId } : {}),\n    };"));
edit("src/auth/auth.service.ts", (t) => t.includes("restaurantId") ? t : t.replace("    const access: AccessPayload = { sub: String(user.id), email: user.email, roles: user.roles };",
  "    const access: AccessPayload = {\n      sub: String(user.id),\n      email: user.email,\n      roles: user.roles,\n      ...(user.restaurantId !== undefined ? { restaurantId: user.restaurantId } : {}),\n    };"));
edit("src/auth/dto/user.response.ts", (t) => t.includes("restaurantId") ? t : t.replace('import { ApiProperty } from "@nestjs/swagger";', 'import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";')
  .replace("  roles!: string[];\n}", '  roles!: string[];\n\n  @ApiPropertyOptional({ example: 1, description: "Only for the restaurant role: the restaurant whose menu this user manages." })\n  restaurantId?: number;\n}'));

// ---- records and responses
edit("src/restaurants/restaurant.types.ts", (t) => t.includes("StoredImage") ? t : t.replace('import type { Area } from "../common/area.js";', 'import type { Area } from "../common/area.js";\nimport type { StoredImage } from "../common/images/image.types.js";').replace("  isOpen: boolean;\n}", "  isOpen: boolean;\n  image?: StoredImage; // the keys, never a URL (the URL is built when it is read)\n}"));
edit("src/dishes/dish.types.ts", (t) => t.includes("StoredImage") ? t : 'import type { StoredImage } from "../common/images/image.types.js";\n\n' + t.replace("  priceSantim: number; // 100 santim = 1 ETB\n}", "  priceSantim: number; // 100 santim = 1 ETB\n  image?: StoredImage; // the keys, never a URL\n}"));

const imageProps = `
  @ApiProperty({ nullable: true, example: "/static/restaurants/3f7a1c52-8d3e-4b7a-9c1e-5a2b6d7e8f90.webp", description: "The full image (WebP, at most 1200 x 800), or null when none was uploaded." })
  imageUrl!: string | null;

  @ApiProperty({ nullable: true, example: "/static/restaurants/3f7a1c52-8d3e-4b7a-9c1e-5a2b6d7e8f90-thumb.webp", description: "A 320 x 240 thumbnail for lists, or null." })
  thumbUrl!: string | null;

  @ApiProperty({ nullable: true, example: "yod-front.jpg", description: "The name the file had when it was uploaded, as a label. Never used as a path." })
  imageName!: string | null;
}`;
edit("src/restaurants/dto/restaurant.response.ts", (t) => t.includes("imageUrl") ? t : t.replace(/\n}\s*$/, "\n" + imageProps.replaceAll("restaurants/", "restaurants/")));
edit("src/dishes/dto/dish.response.ts", (t) => t.includes("imageUrl") ? t : t.replace(/\n}\s*$/, "\n" + imageProps.replaceAll("/static/restaurants/", "/static/dishes/").replaceAll("yod-front.jpg", "doro-wat.jpg")));

// ---- services
edit("src/restaurants/restaurants.service.ts", (t) => t.includes("ImageService") ? t : t
  .replace('import { Inject, Injectable } from "@nestjs/common";', 'import { Inject, Injectable } from "@nestjs/common";\nimport { ImageService } from "../common/images/image.service.js";')
  .replace("    private readonly repo: RestaurantRepository,\n  ) {}", "    private readonly repo: RestaurantRepository,\n    private readonly images: ImageService,\n  ) {}")
  .replace(/\n}\s*$/, `

  // Replace the restaurant's image: process, store, save, and only then delete the old pair (see ImageService.attach)
  async setImage(id: number, file: Express.Multer.File): Promise<Restaurant> {
    const restaurant = this.findOne(id);
    await this.images.attach(file, "restaurants", restaurant.image, (image) => {
      this.repo.save({ ...restaurant, image });
    });
    return this.findOne(id);
  }
}
`));
edit("src/dishes/dishes.service.ts", (t) => t.includes("ImageService") ? t : t
  .replace('import { matchesText, paginate, sortRows } from "../common/page.js";', 'import { ImageService } from "../common/images/image.service.js";\nimport { matchesText, paginate, sortRows } from "../common/page.js";')
  .replace("    private readonly restaurants: RestaurantLookup,\n  ) {}", "    private readonly restaurants: RestaurantLookup,\n    private readonly images: ImageService,\n  ) {}")
  .replace("  private requireRestaurant(id: number): void {", `  async setImage(id: number, file: Express.Multer.File): Promise<Dish> {
    const dish = this.findOne(id);
    await this.images.attach(file, "dishes", dish.image, (image) => {
      this.repo.save({ ...dish, image });
    });
    return this.findOne(id);
  }

  private requireRestaurant(id: number): void {`));
edit("src/dishes/dishes.module.ts", (t) => t.includes("ImageService") ? t : t
  .replace('import { RestaurantsModule }', 'import { ImageService } from "../common/images/image.service.js";\nimport { MenuPolicy } from "../common/policies/menu.policy.js";\nimport { RestaurantsModule }')
  .replace("      useFactory: (repo: DishRepository, restaurants: RestaurantsService) =>\n        new DishesService(repo, restaurants),\n      inject: [DISH_REPOSITORY, RestaurantsService],\n    },", "      useFactory: (repo: DishRepository, restaurants: RestaurantsService, images: ImageService) =>\n        new DishesService(repo, restaurants, images),\n      inject: [DISH_REPOSITORY, RestaurantsService, ImageService],\n    },\n    MenuPolicy,"));
edit("src/restaurants/restaurants.module.ts", (t) => t.includes("MenuPolicy") ? t : t
  .replace('import { RestaurantsController }', 'import { MenuPolicy } from "../common/policies/menu.policy.js";\nimport { RestaurantsController }')
  .replace("    RestaurantsService,\n    {", "    RestaurantsService,\n    MenuPolicy,\n    {"));

// ---- controllers
const upload = (what, guard, path) => `
  // POST ${path}: the nine-step pipeline. Steps 1 to 3 (JWT, role, policy) cost nothing: they refuse BEFORE Multer reads a byte.
  @Post(":id/image")
  @Roles("restaurant", "staff") // the ROLE gate
  @${guard}() // the POLICY gate: a restaurant user only for their own ${what}
  @Throttle({ default: { limit: () => envInt("THROTTLE_UPLOAD_LIMIT", 30), ttl: 3_600_000 } }) // resizing is real work (API4)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 10, parts: 12 } }))
  @ApiBearerAuth("bearer")
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary", description: "A JPEG, PNG or WebP image, at most 2 MB." } } } })
  @ApiOperation({
    summary: "Upload or replace the image of a ${what}",
    description: "multipart/form-data with ONE field named \`file\`. The type is read from the file's bytes, never from its name or Content-Type. The image is re-encoded to WebP (1200 x 800 at most) with a 320 x 240 thumbnail, and its EXIF (including any GPS position) is removed. Replacing an image deletes the old files.",
  })
  @ApiCreatedResponse({ type: ${what === "restaurant" ? "RestaurantResponse" : "DishResponse"}, description: "The ${what}, now with imageUrl, thumbUrl and imageName." })
  @ApiErrors({
    400: "No file was sent, it is not in a field named file, or the id is not a whole number.",
    401: "Missing, invalid or expired access token.",
    403: "The caller is neither staff nor the restaurant that owns this ${what}.",
    404: "No ${what} has that id.",
    413: "The file is larger than 2 MB.",
    422: "The file is not a JPEG, PNG or WebP image (judged by its bytes), or it could not be decoded.",
    429: "Too many uploads from this address. Wait the number of seconds in the Retry-After header.",
  })
  uploadImage(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile(imageFilePipe()) file?: Express.Multer.File,
  ): Promise<${what === "restaurant" ? "Restaurant" : "Dish"}> {
    if (!file) throw new BadRequestException('Send the image as multipart/form-data in ONE field named "file"');
    return this.${what === "restaurant" ? "restaurants" : "dishes"}.setImage(id, file);
  }
}
`;

const commonImports = (what) => `import { BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { ${what === "restaurant" ? "RestaurantManageGuard" : "DishManageGuard"} } from "../common/guards/${what === "restaurant" ? "restaurant" : "dish"}-manage.guard.js";
import { ImageViewInterceptor } from "../common/images/image-view.interceptor.js";
import { MAX_IMAGE_BYTES } from "../common/images/image.service.js";
import { imageFilePipe } from "../common/images/parse-image-file.pipe.js";
import { envInt } from "../config/security.config.js";
`;

edit("src/restaurants/restaurants.controller.ts", (t) => {
  if (t.includes("FileInterceptor")) return t;
  t = t.replace("  UseInterceptors,\n} from \"@nestjs/common\";", "  UploadedFile,\n  UseInterceptors,\n} from \"@nestjs/common\";");
  t = t.replace('import { Public } from "../common/decorators/public.decorator.js";', commonImports("restaurant") + 'import { Public } from "../common/decorators/public.decorator.js";');
  t = t.replace('import { ApiBearerAuth, ApiCreatedResponse,', 'import { ApiBearerAuth, ApiCreatedResponse,');
  t = t.replace('@ApiTags("restaurants")\n@Controller("restaurants")', '@UseInterceptors(ImageViewInterceptor) // keys in the record, URLs in the response\n@ApiTags("restaurants")\n@Controller("restaurants")');
  t = t.replace("import { ApiBearerAuth,", "import { ApiBearerAuth,");
  // guard decorator is applied by name below: make @RestaurantManageGuard() a real decorator
  t = t.replace(/\n}\s*$/, "\n" + upload("restaurant", "RestaurantManageGuard", "/restaurants/:id/image"));
  return t.replace(/@RestaurantManageGuard\(\)/g, "@UseGuards(RestaurantManageGuard)");
});
edit("src/dishes/dishes.controller.ts", (t) => {
  if (t.includes("FileInterceptor")) return t;
  t = t.replace("  UseInterceptors,\n} from \"@nestjs/common\";", "  UploadedFile,\n  UseInterceptors,\n} from \"@nestjs/common\";");
  t = t.replace('import { Public } from "../common/decorators/public.decorator.js";', commonImports("dish") + 'import { Public } from "../common/decorators/public.decorator.js";');
  t = t.replace('@ApiTags("dishes")\n@Controller("dishes")', '@UseInterceptors(ImageViewInterceptor) // keys in the record, URLs in the response\n@ApiTags("dishes")\n@Controller("dishes")');
  t = t.replace(/\n}\s*$/, "\n" + upload("dish", "DishManageGuard", "/dishes/:id/image"));
  return t.replace(/@DishManageGuard\(\)/g, "@UseGuards(DishManageGuard)");
});
for (const f of ["src/restaurants/restaurants.controller.ts", "src/dishes/dishes.controller.ts"]) edit(f, (t) => t.includes("  UseGuards,") ? t : t.replace("  UploadedFile,\n", "  UploadedFile,\n  UseGuards,\n"));

// the nested menu is a response too
edit("src/dishes/restaurant-dishes.controller.ts", (t) => t.includes("ImageViewInterceptor") ? t : t
  .replace('import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";', 'import { Controller, Get, Param, ParseIntPipe, Query, UseInterceptors } from "@nestjs/common";\nimport { ImageViewInterceptor } from "../common/images/image-view.interceptor.js";')
  .replace('@ApiTags("restaurants", "dishes")', '@UseInterceptors(ImageViewInterceptor)\n@ApiTags("restaurants", "dishes")'));

// POST /dishes: the restaurant role may add dishes to ITS OWN menu (the Day 62 DishPolicy homework)
edit("src/dishes/dishes.controller.ts", (t) => t.includes("canManage") ? t : t
  .replace("  Controller,\n", "  Controller,\n  ForbiddenException,\n")
  .replace('import { Roles } from "../common/decorators/roles.decorator.js";', 'import type { AuthenticatedUser } from "../common/auth/auth.types.js";\nimport { CurrentUser } from "../common/decorators/current-user.decorator.js";\nimport { MenuPolicy } from "../common/policies/menu.policy.js";\nimport { Roles } from "../common/decorators/roles.decorator.js";')
  .replace("  constructor(private readonly dishes: DishesService) {}", "  constructor(\n    private readonly dishes: DishesService,\n    private readonly menuPolicy: MenuPolicy,\n  ) {}")
  .replace(/  \/\/ Staff only for now\.[\s\S]*?\n  @Roles\("staff"\)\n/, '  @Roles("staff", "restaurant") // the restaurant role only for ITS OWN menu: checked below, because the restaurantId is in the body\n')
  .replace('    403: "The caller is not staff.",\n    404: "The restaurant does not exist.",', '    403: "The caller is neither staff nor the restaurant whose menu this is.",\n    404: "The restaurant does not exist.",')
  .replace("  create(@Body() dto: CreateDishDto): Dish {\n    return this.dishes.create(dto);", "  create(@Body() dto: CreateDishDto, @CurrentUser() user: AuthenticatedUser): Dish {\n    if (!this.menuPolicy.canManage(user, dto.restaurantId)) {\n      throw new ForbiddenException(\"You may only add dishes to your own restaurant's menu\");\n    }\n    return this.dishes.create(dto);"));
NODE

# ------------------------------------------------------------------ 5. wiring: module, static files, settings
node - << 'NODE'
const fs = require("fs");
const edit = (f, fn) => { const t = fs.readFileSync(f, "utf8"); const r = fn(t); fs.writeFileSync(f, r); console.log(r === t ? "already " + f : "edited  " + f); };

edit("src/app.module.ts", (t) => t.includes("StorageModule") ? t : t
  .replace('import { HealthModule }', 'import { StorageModule } from "./common/storage/storage.module.js";\nimport { HealthModule }')
  .replace("    HealthModule,\n", "    StorageModule, // uploaded files, behind an interface\n    HealthModule,\n"));

edit("src/main.ts", (t) => t.includes("useStaticAssets") ? t : t
  .replace('import { setupSwagger } from "./config/swagger.setup.js";', 'import { uploadRoot } from "./config/storage.config.js";\nimport { setupSwagger } from "./config/swagger.setup.js";')
  .replace("  // 3 - a body limit:", `  // 2b - uploaded images. The keys are UUIDs, so a stored file NEVER changes: cache it for a year. These files are PUBLIC (a UUID in
  // the path is not a permission: private files, such as receipts, go through a controller or a signed URL). helmet's default
  // Cross-Origin-Resource-Policy is same-origin, which would stop the frontend's <img> loading them, so these opt out.
  app.useStaticAssets(uploadRoot(), {
    prefix: "/static/",
    maxAge: "365d",
    immutable: true,
    index: false,
    dotfiles: "deny",
    setHeaders: (res) => res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
  });

  // 3 - a body limit:`));

edit("src/config/validate-env.ts", (t) => t.replace('["THROTTLE_LIMIT", "THROTTLE_STRICT_LIMIT", "THROTTLE_REGISTER_LIMIT"]', '["THROTTLE_LIMIT", "THROTTLE_STRICT_LIMIT", "THROTTLE_REGISTER_LIMIT", "THROTTLE_UPLOAD_LIMIT"]'));

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.scripts["start:dev:relaxed"] = "THROTTLE_STRICT_LIMIT=10000 THROTTLE_REGISTER_LIMIT=10000 THROTTLE_UPLOAD_LIMIT=10000 nest start --watch";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("edited  package.json (start:dev:relaxed)");
NODE

cat >> .env.example << 'EOF'

# Where uploaded images are stored on disk (default ./uploads). Local disk is a trap in a container: Module 7 replaces it with object storage.
# UPLOAD_DIR=./uploads
# Image uploads allowed per address per hour (default 30): resizing is real work.
# THROTTLE_UPLOAD_LIMIT=30
EOF
grep -qx "uploads/" .gitignore || printf 'uploads/\n' >> .gitignore
echo "edited  .gitignore (uploads/)"

# the seed password comment
for f in .env.example; do :; done


# ------------------------------------------------------------------ 6. specs: no HTTP, no database (the Day 62 habit: assert the REFUSALS)
cat > src/common/images/image.service.spec.ts << 'EOF'
import { UnprocessableEntityException } from "@nestjs/common";
import type { PinoLogger } from "nestjs-pino";
import sharp = require("sharp");
import type { StorageService } from "../storage/storage.service.js";
import { detectImageType } from "./detect-image-type.js";
import { ImageService } from "./image.service.js";
import type { StoredImage } from "./image.types.js";

class FakeStorage implements StorageService {
  files = new Map<string, Buffer>();
  failOnSuffix?: string; // make a put fail, to prove the rollback
  async put(key: string, body: Buffer): Promise<void> {
    if (this.failOnSuffix && key.endsWith(this.failOnSuffix)) throw new Error("disk full");
    this.files.set(key, body);
  }
  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }
  urlFor(key: string): string {
    return `/static/${key}`;
  }
}

const logger = { warn: () => undefined } as unknown as PinoLogger;
const upload = (buffer: Buffer, originalname = "yod.jpg"): Express.Multer.File =>
  ({ buffer, originalname, mimetype: "image/jpeg", size: buffer.length, fieldname: "file", encoding: "7bit" }) as Express.Multer.File;

// A real photograph-shaped JPEG, WITH an EXIF block that carries a GPS position
const photo = (width = 1600, height = 1200): Promise<Buffer> =>
  sharp({ create: { width, height, channels: 3, background: "#888888", noise: { type: "gaussian", mean: 128, sigma: 40 } } })
    .jpeg()
    .withExif({
      IFD0: { Copyright: "Yod Abyssinia" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "9/1 1/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "38/1 45/1 0/1" },
    })
    .toBuffer();

describe("detectImageType (the bytes, not the name)", () => {
  it("recognises a JPEG, a PNG and a WebP by their first bytes", async () => {
    expect(detectImageType(await photo(40, 40))?.mime).toBe("image/jpeg");
    expect(detectImageType(await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).png().toBuffer())?.mime).toBe("image/png");
    expect(detectImageType(await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).webp().toBuffer())?.mime).toBe("image/webp");
  });
  it("refuses a PHP web shell, a PDF, a GIF, an empty file and a truncated signature", () => {
    expect(detectImageType(Buffer.from("<?php system($_GET['c']); ?>"))).toBeUndefined();
    expect(detectImageType(Buffer.from("%PDF-1.4\n1 0 obj"))).toBeUndefined();
    expect(detectImageType(Buffer.from("GIF89a......"))).toBeUndefined();
    expect(detectImageType(Buffer.alloc(0))).toBeUndefined();
    expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeUndefined();
  });
  it("needs BOTH parts of a WebP signature: a WAV file also starts with RIFF", () => {
    const wav = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WAVEfmt ")]);
    expect(detectImageType(wav)).toBeUndefined();
  });
});

describe("ImageService", () => {
  let storage: FakeStorage;
  let service: ImageService;
  beforeEach(() => {
    storage = new FakeStorage();
    service = new ImageService(storage, logger);
  });
  const attach = (file: Express.Multer.File, current?: StoredImage, persist: (i: StoredImage) => void = () => undefined) =>
    service.attach(file, "restaurants", current, persist);

  describe("what is refused", () => {
    it("refuses a PHP file renamed cat.jpg and sent as image/jpeg, and stores nothing", async () => {
      await expect(attach(upload(Buffer.from("<?php system($_GET['c']); ?>"), "cat.jpg"))).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(storage.files.size).toBe(0);
    });
    it("refuses a PDF renamed to .jpg", async () => {
      await expect(attach(upload(Buffer.from("%PDF-1.4 ...."), "menu.jpg"))).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(storage.files.size).toBe(0);
    });
    it("refuses bytes that start like a JPEG but are not one", async () => {
      const lie = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("this is not image data at all")]);
      await expect(attach(upload(lie))).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(storage.files.size).toBe(0);
    });
  });

  describe("what is stored", () => {
    it("stores two WebP files under generated names that resemble nothing the caller sent", async () => {
      const image = await attach(upload(await photo(), "../../etc/YOD-front.php.jpg"));
      expect(image.key).toMatch(/^restaurants\/[0-9a-f-]{36}\.webp$/);
      expect(image.thumbKey).toMatch(/^restaurants\/[0-9a-f-]{36}-thumb\.webp$/);
      expect(`${image.key}${image.thumbKey}`.toLowerCase()).not.toMatch(/yod|php|etc|jpg/);
      expect([...storage.files.keys()].sort()).toEqual([image.key, image.thumbKey].sort());
    });
    it("keeps the original name only as a cleaned label, with the path stripped", async () => {
      const image = await attach(upload(await photo(64, 64), "../../etc/yod front.jpg"));
      expect(image.originalName).toBe("yod front.jpg");
      expect(image.detectedType).toBe("image/jpeg");
    });
    it("makes a 1200 x 800 (at most) full image and a 320 x 240 thumbnail, and the thumbnail is smaller", async () => {
      const image = await attach(upload(await photo()));
      const full = await sharp(storage.files.get(image.key)).metadata();
      const thumb = await sharp(storage.files.get(image.thumbKey)).metadata();
      expect(full.format).toBe("webp");
      expect(full.width).toBeLessThanOrEqual(1200);
      expect(full.height).toBeLessThanOrEqual(800);
      expect([thumb.width, thumb.height]).toEqual([320, 240]);
      expect(image.thumbSize).toBeLessThan(image.size);
    });
    it("never enlarges a small image", async () => {
      const image = await attach(upload(await photo(100, 100)));
      const full = await sharp(storage.files.get(image.key)).metadata();
      expect([full.width, full.height]).toEqual([100, 100]);
    });
    it("strips the EXIF, GPS position included, from BOTH files", async () => {
      const original = await photo();
      expect((await sharp(original).metadata()).exif).toBeDefined(); // the test is meaningful: the input HAS metadata
      const image = await attach(upload(original));
      expect((await sharp(storage.files.get(image.key)).metadata()).exif).toBeUndefined();
      expect((await sharp(storage.files.get(image.thumbKey)).metadata()).exif).toBeUndefined();
    });
  });

  describe("replacing and rolling back (the ordering that fails safe)", () => {
    it("deletes the OLD pair after the new one is saved, leaving exactly one pair", async () => {
      const first = await attach(upload(await photo(400, 300)));
      const second = await attach(upload(await photo(400, 300)), first);
      expect(second.key).not.toBe(first.key);
      expect([...storage.files.keys()].sort()).toEqual([second.key, second.thumbKey].sort());
    });
    it("deletes the NEW pair, and keeps the old one, when saving the record fails", async () => {
      const first = await attach(upload(await photo(400, 300)));
      await expect(
        attach(upload(await photo(400, 300)), first, () => {
          throw new Error("database down");
        }),
      ).rejects.toThrow("database down");
      expect([...storage.files.keys()].sort()).toEqual([first.key, first.thumbKey].sort());
    });
    it("deletes the full image again when storing the thumbnail fails", async () => {
      storage.failOnSuffix = "-thumb.webp";
      await expect(attach(upload(await photo(400, 300)))).rejects.toThrow("disk full");
      expect(storage.files.size).toBe(0);
    });
    it("does not fail the request when deleting the replaced files fails: it logs an orphan", async () => {
      const first = await attach(upload(await photo(400, 300)));
      storage.delete = async () => {
        throw new Error("permission denied");
      };
      await expect(attach(upload(await photo(400, 300)), first)).resolves.toBeDefined();
    });
  });
});
EOF

cat > src/common/storage/local-storage.service.spec.ts << 'EOF'
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStorageService } from "./local-storage.service.js";

describe("LocalStorageService", () => {
  let dir: string;
  let storage: LocalStorageService;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "addis-uploads-"));
    process.env["UPLOAD_DIR"] = dir;
    storage = new LocalStorageService();
  });
  afterEach(() => {
    delete process.env["UPLOAD_DIR"];
    rmSync(dir, { recursive: true, force: true });
  });

  it("stores, serves a URL for, and deletes a file", async () => {
    await storage.put("restaurants/a.webp", Buffer.from("bytes"), "image/webp");
    expect(readFileSync(join(dir, "restaurants/a.webp")).toString()).toBe("bytes");
    expect(storage.urlFor("restaurants/a.webp")).toBe("/static/restaurants/a.webp");
    await storage.delete("restaurants/a.webp");
    expect(existsSync(join(dir, "restaurants/a.webp"))).toBe(false);
  });
  it("treats deleting a file that is already gone as fine", async () => {
    await expect(storage.delete("restaurants/never-existed.webp")).resolves.toBeUndefined();
  });

  describe("refuses a key that would escape the upload directory (path traversal)", () => {
    it.each(["../escape.webp", "restaurants/../../escape.webp", "/etc/passwd", "", ".", "restaurants/.."])("%j", async (key) => {
      await expect(storage.put(key, Buffer.from("x"), "image/webp")).rejects.toThrow(/escapes the upload directory/);
      await expect(storage.delete(key)).rejects.toThrow(/escapes the upload directory/);
      expect(() => storage.urlFor(key)).toThrow(/escapes the upload directory/);
    });
  });
});
EOF

cat > src/common/policies/menu.policy.spec.ts << 'EOF'
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { MenuPolicy } from "./menu.policy.js";

const policy = new MenuPolicy();
const user = (roles: AuthenticatedUser["roles"], restaurantId?: number): AuthenticatedUser => ({ id: 9, email: "u@example.et", roles, restaurantId });

describe("MenuPolicy", () => {
  it("lets staff manage any restaurant's menu", () => {
    expect(policy.canManage(user(["staff"]), 1)).toBe(true);
    expect(policy.canManage(user(["staff"]), 2)).toBe(true);
  });
  it("lets a restaurant user manage its OWN menu", () => {
    expect(policy.canManage(user(["restaurant"], 1), 1)).toBe(true);
  });

  describe("what is refused", () => {
    it("refuses a restaurant user on ANOTHER restaurant's menu", () => {
      expect(policy.canManage(user(["restaurant"], 1), 2)).toBe(false);
    });
    it("refuses a restaurant user whose token carries no restaurantId", () => {
      expect(policy.canManage(user(["restaurant"]), 1)).toBe(false);
    });
    it("refuses a customer, even one who somehow carries a restaurantId", () => {
      expect(policy.canManage(user(["customer"]), 1)).toBe(false);
      expect(policy.canManage(user(["customer"], 1), 1)).toBe(false);
    });
    it("refuses a courier", () => {
      expect(policy.canManage(user(["courier"], 1), 1)).toBe(false);
    });
  });
});
EOF

# ------------------------------------------------------------------ 7. fixtures (generated, never committed) and the upload matrix
cat > scripts/make-fixtures.mjs << 'EOF'
// Generates the files the upload matrix sends. Usage: node scripts/make-fixtures.mjs <output-dir>
// Nothing here is committed: the big and "bomb" files are generated on demand.
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const sharp = createRequire(process.cwd() + "/")("sharp");
const out = process.argv[2] ?? "fixtures";
mkdirSync(out, { recursive: true });

const scene = (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a1f1f"/><stop offset="1" stop-color="#e8a33d"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${w * 0.3}" cy="${h * 0.55}" r="${h * 0.22}" fill="#f4ead2"/><circle cx="${w * 0.7}" cy="${h * 0.45}" r="${h * 0.16}" fill="#3b5d2a"/>
  <rect x="${w * 0.1}" y="${h * 0.78}" width="${w * 0.8}" height="${h * 0.06}" fill="#2b1a10"/></svg>`);

// 1. a real photograph-shaped JPEG that carries an EXIF block WITH a GPS position (the privacy leak a phone photo has)
await sharp(scene(1600, 1200)).jpeg({ quality: 90 })
  .withExif({ IFD0: { Make: "TestPhone", Copyright: "Yod Abyssinia" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "9/1 1/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "38/1 45/1 0/1" } })
  .toFile(join(out, "yod.jpg"));
// 2. a real PNG
await sharp(scene(800, 600)).png().toFile(join(out, "logo.png"));
// 3. a JPEG over 2 MB (noise does not compress)
await sharp({ create: { width: 2400, height: 2400, channels: 3, background: "#888", noise: { type: "gaussian", mean: 128, sigma: 60 } } }).jpeg({ quality: 95 }).toFile(join(out, "big.jpg"));
// 4 and 5. not images at all, renamed .jpg
writeFileSync(join(out, "fake-pdf.jpg"), "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n");
writeFileSync(join(out, "shell.jpg"), "<?php system($_GET['c']); ?>\n");
// 6. a pixel bomb: a valid PNG that is small on disk and 64 million pixels when decoded
await sharp({ create: { width: 8000, height: 8000, channels: 3, background: "#123456" } }).png({ compressionLevel: 9 }).toFile(join(out, "bomb.png"));

for (const f of ["yod.jpg", "logo.png", "big.jpg", "fake-pdf.jpg", "shell.jpg", "bomb.png"]) console.log(f.padEnd(14), String(statSync(join(out, f)).size).padStart(9), "bytes");
EOF

cat > upload-matrix.sh << 'EOF'
#!/usr/bin/env bash
# The Day 64 upload matrix. Needs the dev server running.   Usage:  bash upload-matrix.sh [base-url]
# Files are written to UPLOAD_DIR (default ./uploads). Restart the server before a second run only if you want a clean count.
BASE="${1:-http://localhost:3000/api/v1}"
ORIGIN="${BASE%/api/v1}"
cd "$(dirname "$0")" || exit 1
SEED=$(grep -E '^SEED_PASSWORD=' .env | cut -d= -f2-)
UP=$(grep -E '^UPLOAD_DIR=' .env 2>/dev/null | cut -d= -f2-); UP="${UP:-./uploads}"

pass=0; fail=0
ok()  { pass=$((pass + 1)); printf 'PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf 'FAIL  %s   (%s)\n' "$1" "$2"; }
login() { curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$1\",\"password\":\"$SEED\"}" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken" 2>/dev/null; }
json() { printf '%s' "$BODY" | node -p "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); $1" 2>/dev/null; }

RESTAURANT=$(login abyssinia@example.et); CUSTOMER=$(login almaz@example.et); STAFF=$(login staff@example.et)
[ -n "$RESTAURANT" ] && [ "$RESTAURANT" != undefined ] || { echo "Could not log in: is the server running, is SEED_PASSWORD in .env, or is the login rate limit hit? (restart the server, or run npm run start:dev:relaxed)"; exit 1; }

FIX=$(mktemp -d); trap 'rm -rf "$FIX"' EXIT
echo "making fixtures (the bomb takes a few seconds)..."; node scripts/make-fixtures.mjs "$FIX" > /dev/null || { echo "could not make fixtures"; exit 1; }

# post NAME WANT TOKEN PATH [curl -F args...]
post() {
  local name=$1 want=$2 token=$3 path=$4; shift 4
  local args=(-s -o /tmp/d64.body -w '%{http_code}' -X POST "$BASE$path")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  CODE=$(curl "${args[@]}" "$@"); BODY=$(cat /tmp/d64.body)
  if [ "$CODE" = "$want" ]; then ok "$name -> $CODE"; else bad "$name" "want $want, got $CODE: ${BODY:0:150}"; fi
}
file() { echo "file=@$FIX/$1;type=${2:-image/jpeg}"; }
count_files() { find "$UP/restaurants" -type f 2>/dev/null | wc -l | tr -d ' '; }
sharp_exif() { node -e "const s=require('sharp');s(process.argv[1]).metadata().then(m=>process.stdout.write(m.exif?'yes':'no'))" "$1"; }

DISH1=$(curl -s "$BASE/restaurants/1/dishes" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).items[0].id")
DISH2=$(curl -s "$BASE/restaurants/2/dishes" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).items[0].id")

echo "--- the nine calls"
post "1  restaurant uploads yod.jpg to its own restaurant"   201 "$RESTAURANT" /restaurants/1/image -F "$(file yod.jpg)"
URL=$(json 'j.imageUrl'); THUMB=$(json 'j.thumbUrl'); NAME=$(json 'j.imageName')
post "2  a 5 MB file"                                        413 "$RESTAURANT" /restaurants/1/image -F "$(file big.jpg)"
post "3  a customer uploads"                                 403 "$CUSTOMER"   /restaurants/1/image -F "$(file yod.jpg)"
post "4  no token"                                           401 ""            /restaurants/1/image -F "$(file yod.jpg)"
post "5  no file at all"                                     400 "$RESTAURANT" /restaurants/1/image
post "6  the wrong field name"                               400 "$RESTAURANT" /restaurants/1/image -F "wrongfield=@$FIX/yod.jpg;type=image/jpeg"
post "7  a PDF renamed .jpg, sent as image/jpeg"             422 "$RESTAURANT" /restaurants/1/image -F "$(file fake-pdf.jpg)"
post "8  a PHP web shell renamed .jpg, sent as image/jpeg"   422 "$RESTAURANT" /restaurants/1/image -F "$(file shell.jpg)"
post "9  restaurant 1's user uploads to restaurant 2"        403 "$RESTAURANT" /restaurants/2/image -F "$(file yod.jpg)"

echo "--- more refusals and the dish route"
post "10 a pixel bomb (64 million pixels in under 2 MB)"     422 "$RESTAURANT" /restaurants/1/image -F "$(file bomb.png image/png)"
post "11 an image for a restaurant that does not exist"      404 "$STAFF"      /restaurants/9999/image -F "$(file yod.jpg)"
post "12 a restaurant user uploads a PNG to its own dish"    201 "$RESTAURANT" /dishes/$DISH1/image -F "$(file logo.png image/png)"
DISH_URL=$(json 'j.imageUrl')
post "13 ...but not to a dish on another menu"               403 "$RESTAURANT" /dishes/$DISH2/image -F "$(file logo.png image/png)"
post "14 staff upload to any restaurant"                     201 "$STAFF"      /restaurants/2/image -F "$(file yod.jpg)"

echo "--- what was actually stored (criteria 3 to 6)"
[[ "$URL" =~ ^/static/restaurants/[0-9a-f-]{36}\.webp$ ]] && ok "the stored name is a UUID plus an extension from the BYTES ($URL)" || bad "stored name" "$URL"
case "$URL$THUMB" in *yod*|*jpg*|*jpeg*) bad "the stored name resembles the input" "$URL";; *) ok "no stored filename resembles any input";; esac
[ "$NAME" = "yod.jpg" ] && ok "the original name is kept as a label only (imageName: $NAME)" || bad "imageName" "$NAME"
FULL_BYTES=$(curl -s "$ORIGIN$URL" | wc -c | tr -d ' '); THUMB_BYTES=$(curl -s "$ORIGIN$THUMB" | wc -c | tr -d ' ')
[ "$THUMB_BYTES" -gt 0 ] && [ "$THUMB_BYTES" -lt "$FULL_BYTES" ] && ok "two variants exist and the thumbnail is smaller ($THUMB_BYTES < $FULL_BYTES bytes)" || bad "variants" "full $FULL_BYTES thumb $THUMB_BYTES"
HDRS=$(curl -sI "$ORIGIN$URL")
printf '%s' "$HDRS" | grep -qi 'content-type: image/webp' && ok "it is served as image/webp" || bad "content type" "$HDRS"
printf '%s' "$HDRS" | grep -qi 'cache-control:.*immutable' && ok "it is cached for a year (the name never changes)" || bad "cache" "$HDRS"
printf '%s' "$HDRS" | grep -qi 'cross-origin-resource-policy: cross-origin' && ok "another origin's <img> may load it (CORP cross-origin)" || bad "CORP" "$HDRS"
[ "$(sharp_exif "$FIX/yod.jpg")" = yes ] && ok "the INPUT had EXIF (so the next check means something)" || bad "fixture has no EXIF" ""
[ "$(sharp_exif "$UP/${URL#/static/}")" = no ] && [ "$(sharp_exif "$UP/${THUMB#/static/}")" = no ] && ok "no EXIF, so no GPS position, in either stored file" || bad "EXIF survived" "$UP/${URL#/static/}"
curl -s "$BASE/restaurants/1" > /tmp/d64.body; BODY=$(cat /tmp/d64.body)
[ "$(json 'j.imageUrl')" = "$URL" ] && ok "the public restaurant now shows its imageUrl" || bad "GET /restaurants/1" "$BODY"
curl -s "$BASE/restaurants/3" > /tmp/d64.body; BODY=$(cat /tmp/d64.body)
[ "$(json 'j.imageUrl === null && j.thumbUrl === null && j.imageName === null')" = true ] && ok "a restaurant with no image answers null, not a missing field" || bad "empty case" "$BODY"
printf '%s' "$BODY" | grep -q '"image"' && bad "internal keys leaked" "$BODY" || ok "the record's internal keys are never in the response"
[[ "$DISH_URL" =~ ^/static/dishes/[0-9a-f-]{36}\.webp$ ]] && ok "a dish image is stored under dishes/ ($DISH_URL)" || bad "dish image" "$DISH_URL"

echo "--- replacing (criterion 5)"
BEFORE=$(count_files)
post "15 upload a second image to the same restaurant" 201 "$RESTAURANT" /restaurants/1/image -F "$(file yod.jpg)"
URL2=$(json 'j.imageUrl')
[ "$URL2" != "$URL" ] && ok "the replacement has a new name" || bad "same name" "$URL2"
[ "$(count_files)" = "$BEFORE" ] && ok "the old pair is gone: still one pair per image ($BEFORE files before and after)" || bad "orphans" "before $BEFORE after $(count_files)"
[ ! -e "$UP/${URL#/static/}" ] && [ "$(curl -s -o /dev/null -w '%{http_code}' "$ORIGIN$URL")" = 404 ] && ok "the old image is no longer served (404)" || bad "old file still there" "$URL"

echo "--- who may add a dish"
post "16 the restaurant adds a dish to its own menu"   201 "$RESTAURANT" /dishes -H 'Content-Type: application/json' -d '{"name":"Shiro Wot","priceSantim":9000,"restaurantId":1}'
post "17 ...but not to another restaurant's menu"       403 "$RESTAURANT" /dishes -H 'Content-Type: application/json' -d '{"name":"Shiro Wot","priceSantim":9000,"restaurantId":2}'
post "18 a customer cannot add a dish"                  403 "$CUSTOMER"   /dishes -H 'Content-Type: application/json' -d '{"name":"Shiro Wot","priceSantim":9000,"restaurantId":1}'

echo; echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
EOF
chmod +x upload-matrix.sh

# ------------------------------------------------------------------ 8. the written standard, the audit and the README
node - << 'NODE'
const fs = require("fs");
const edit = (f, fn) => { if (!fs.existsSync(f)) { console.log("skipped " + f); return; } const t = fs.readFileSync(f, "utf8"); const r = fn(t); fs.writeFileSync(f, r); console.log(r === t ? "already " + f : "edited  " + f); };

edit("docs/api-standard.md", (t) => t.includes("## 11. File uploads") ? t : t.trimEnd() + `

## 11. File uploads (Day 64)

- **Routes:** \`POST /restaurants/:id/image\` and \`POST /dishes/:id/image\`: \`multipart/form-data\` with ONE field named \`file\`. 201 returns the record with \`imageUrl\`, \`thumbUrl\` and \`imageName\`. A record with no image answers \`null\` for all three, never a missing property.
- **Who:** staff, or a user with the restaurant role for **their own** restaurant (the \`restaurantId\` in the token). A refusal is **403**: a menu is public, so nothing is hidden. The same \`MenuPolicy\` lets a restaurant add dishes to its own menu.
- **The pipeline, in order, and where each step refuses:** the JWT (401), the role (403), the policy (403/404), Multer's 2 MB limit (**413**), \`ParseFilePipe\` on size and the *claimed* type (**422**), the magic-number check on the bytes (**422**), sharp decoding (**422** if corrupt or over 50 million pixels), storage and the save (500, and the stored files are rolled back). Steps 1 to 3 refuse before a single byte of the body is read.
- **No file, or the wrong field name, is 400** (a malformed request). A file that is the wrong KIND is **422** (a well-formed request whose content is not acceptable).
- **The caller's claims are never trusted:** \`originalname\`, \`mimetype\` and the extension are strings the caller typed. The type is read from the bytes. The stored name is a generated UUID plus the extension of the *detected* type; the original name is kept only as a cleaned label and is never part of a path.
- **Re-encoded, always:** every image is decoded and written again as WebP (at most 1200 x 800, plus a 320 x 240 thumbnail), which removes whatever the original carried, EXIF and its GPS position included.
- **Storage is behind \`StorageService\`** (\`put\`, \`delete\`, \`urlFor\`). Today it is local disk (\`UPLOAD_DIR\`); Module 7 changes one line in \`StorageModule\`. The record keeps **keys, never URLs**: the URL is built when the record is read.
- **Replacing** stores the new files, saves the record, and only then deletes the old files; if the save fails the new files are deleted. There is no transaction across a disk and a database, so the failure we choose is an orphaned file (a sweep collects it later), never a row pointing at nothing.
- **Public files:** \`/static/...\` has no authorisation and is cached for a year (names never change). Anything private, such as a receipt, goes through a controller or a signed URL, never a long random path.
`);

edit("docs/api-audit.md", (t) => t.includes("/restaurants/:id/image") ? t : t
  .replace("| POST /dishes | staff | **role only** (restaurant role: DishPolicy homework) | default |", "| POST /dishes | staff, or the restaurant that owns the menu | **role**, then **policy** (MenuPolicy, Day 64) | default |\n| POST /restaurants/:id/image | staff, or that restaurant's own user | **role**, then **policy** (MenuPolicy), then Multer's 2 MB limit | 30 per hour per address |\n| POST /dishes/:id/image | staff, or the restaurant that owns the dish | **role**, then **policy** (MenuPolicy), then Multer's 2 MB limit | 30 per hour per address |\n| GET /static/* | anyone | public, on purpose (menu images); UUID names, cached for a year | none |"));

edit("README.md", (t) => t.includes("### File uploads (Day 64)") ? t : t.trimEnd() + `

### File uploads (Day 64)
Restaurants and dishes can have an image. An upload is the most dangerous route in an API (it accepts arbitrary bytes from a stranger and writes them to disk), so the endpoint is mostly **refusal logic** with a small amount of storage at the end.

| Route | Who | Does |
|---|---|---|
| \`POST /api/v1/restaurants/:id/image\` | staff, or that restaurant's own user | Upload or replace the restaurant's image |
| \`POST /api/v1/dishes/:id/image\` | staff, or the restaurant that owns the dish | Upload or replace a dish's image |
| \`GET /static/restaurants/<uuid>.webp\` | anyone | The stored file (public, cached for a year) |

Send \`multipart/form-data\` with ONE field named \`file\` (JPEG, PNG or WebP, at most 2 MB): \`curl -X POST .../restaurants/1/image -H "Authorization: Bearer $TOKEN" -F "file=@yod.jpg"\`. The record then has \`imageUrl\`, \`thumbUrl\` and \`imageName\` (all \`null\` until an image exists).

**The pipeline (where each step refuses)**
| # | Step | Where | Fails with |
|---|---|---|---|
| 1 to 3 | JWT, role, \`MenuPolicy\`: may this user manage this restaurant? | guards, **before any byte is read** | 401, 403, 404 |
| 4 | Multer reads, at most 2 MB (memory storage: the limit is what makes that safe) | \`FileInterceptor\` | **413** |
| 5 | The polite checks: size, and the *claimed* type | \`ParseFilePipe\` | 422 |
| 6 | **The real check: the first bytes (JPEG, PNG or WebP)** | \`ImageService\`, \`detectImageType\` | 422 |
| 7 | sharp decodes, resizes, strips EXIF, writes WebP (a 50-million-pixel cap stops decompression bombs) | \`ImageService\` | 422 |
| 8 to 9 | Store both files under generated names, save the record, then delete the old files | \`StorageService\` | 500, and the new files are rolled back |

**Decisions**
- **\`file.mimetype\` and \`originalname\` are strings the caller typed.** A PHP shell renamed \`cat.jpg\` and sent as \`image/jpeg\` passes a MIME whitelist and fails the magic-number check (422). The type comes from the bytes, and the stored name is \`<uuid>.webp\`: nothing the caller sent is ever part of a path.
- **I wrote the 20-line signature check instead of using \`file-type\`.** Since v17 that package is ESM-only (it breaks this CommonJS project and jest), and it parses hundreds of formats when we accept three. It is one function to swap if the list of formats grows.
- **Re-encoding is a security control:** whatever was hidden in the original does not survive, and neither does the EXIF with its GPS position.
- **Storage is behind an interface** (\`put\`, \`delete\`, \`urlFor\`), exactly as the repositories are. Local disk today (\`UPLOAD_DIR\`, default \`./uploads\`, never committed); Module 7 changes one line in \`StorageModule\`. Local disk in a container loses every image at the next restart.
- **The record keeps keys, never URLs** (\`ImageViewInterceptor\` builds the URL when the record is read), so a change of bucket or CDN does not make every row wrong.
- **Replacing stores first and deletes last.** There is no transaction across a disk and a database, so the failure chosen is an orphaned file, never a row that points at nothing. A periodic sweep (Day 68) is the plan for what is left.
- **\`/static\` is public.** A UUID in a path is not a permission, so private files (receipts) must never be served this way.
- **The token now carries \`restaurantId\`** (a snapshot, like the roles) so \`MenuPolicy\` can compare it with the menu being changed. That also lets a restaurant add dishes to its own menu.
- Uploads are rate limited (30 an hour per address, \`THROTTLE_UPLOAD_LIMIT\`) because resizing is real work.

Checks: \`npm test\` (policy and image specs), then with the server running \`bash upload-matrix.sh\` (it generates its own test files, including a 5 MB file and a pixel bomb).
`);
NODE

echo
echo "Done. Next:  npx tsc --noEmit && npm test && npm run start:dev:relaxed"
echo "Then, in another terminal:  bash upload-matrix.sh"
