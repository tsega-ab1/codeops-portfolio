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
