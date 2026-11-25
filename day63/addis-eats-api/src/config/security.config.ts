// Security settings come from the environment (validated at startup in validate-env.ts), never from the source.

// A whole number from an env var, or the fallback. Read at request time, so a .env change needs only a restart.
export function envInt(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

// The origins a browser may call this API from. An exact list, never "*".
// In development a Vite/React frontend is allowed by default; in production nothing is unless CORS_ORIGINS says so.
export function corsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env["CORS_ORIGINS"];
  if (raw !== undefined && raw.trim() !== "") return raw.split(",").map((o) => o.trim());
  return env["NODE_ENV"] === "production" ? [] : ["http://localhost:5173", "http://localhost:3001"];
}
