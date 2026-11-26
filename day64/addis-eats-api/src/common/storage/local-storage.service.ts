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
