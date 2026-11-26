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
