import type { Role } from "../common/auth/auth.types.js";

// The RECORD. It contains hashes, so it must never leave the service layer.
export interface User {
  readonly id: number;
  email: string;
  passwordHash: string; // argon2id, with its salt inside the string
  roles: Role[];
  refreshHash: string | null; // argon2id of the CURRENT refresh token; null = logged out
}

// What may be shown to a caller: an explicit mapping, never the record itself
export interface PublicUser {
  id: number;
  email: string;
  roles: Role[];
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, roles: [...user.roles] };
}
