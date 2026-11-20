import { randomUUID } from "node:crypto";

// A caller's id is kept only if it is harmless to log: letters, digits, . _ - and not too long.
// Anything else (a huge string, a line break to forge log lines) is replaced by a fresh uuid.
const SAFE_ID = /^[A-Za-z0-9._-]{1,128}$/;

export function resolveRequestId(sent: string | string[] | undefined): string {
  const candidate = Array.isArray(sent) ? sent[0] : sent;
  return candidate && SAFE_ID.test(candidate) ? candidate : randomUUID();
}
