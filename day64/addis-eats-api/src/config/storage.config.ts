import { resolve } from "node:path";

// Where uploaded files live on disk. A setting, not a constant: Module 7 mounts a volume here (and then replaces it with object storage).
export function uploadRoot(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env["UPLOAD_DIR"];
  return resolve(configured !== undefined && configured.trim() !== "" ? configured : "uploads");
}
