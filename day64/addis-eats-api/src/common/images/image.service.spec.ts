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
