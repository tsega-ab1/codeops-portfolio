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
