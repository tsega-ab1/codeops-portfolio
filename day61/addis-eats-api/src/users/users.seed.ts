import type { Role } from "../common/auth/auth.types.js";

// Development accounts, created at startup (never in production).
// Their password is SEED_PASSWORD from .env, so no password and no hash is ever committed.
export const SEED_USERS: ReadonlyArray<{ email: string; roles: Role[] }> = [
  { email: "staff@example.et", roles: ["staff"] },
  { email: "almaz@example.et", roles: ["customer"] },
  { email: "dawit@example.et", roles: ["customer"] },
];
