import type { Role } from "../common/auth/auth.types.js";

// Development accounts, created at startup (never in production), one per role plus a second customer.
// Their password is SEED_PASSWORD from .env, so no password and no hash is ever committed.
// The ORDER matters: ids are handed out 1, 2, 3, ... and the seed orders refer to them.
export const SEED_USERS: ReadonlyArray<{ email: string; roles: Role[]; restaurantId?: number }> = [
  { email: "staff@example.et", roles: ["staff"] },
  { email: "almaz@example.et", roles: ["customer"] },
  { email: "dawit@example.et", roles: ["customer"] },
  { email: "kebede@example.et", roles: ["courier"] },
  { email: "abyssinia@example.et", roles: ["restaurant"], restaurantId: 1 },
];

// The ids those five get, so orders.seed.ts can say who owns what without magic numbers
export const SEED_USER_ID = { staff: 1, almaz: 2, dawit: 3, kebede: 4, abyssinia: 5 } as const;
