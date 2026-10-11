// Prevents open redirects. Only same-site paths are allowed.
// Note: "//evil.com" and "/\evil.com" start with "/" but point to another host,
// so startsWith("/") alone is NOT enough.
export function safeNext(value, fallback = "/") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(value)) return fallback;
  return value;
}
