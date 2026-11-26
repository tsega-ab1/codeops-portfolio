import type { Role } from "../common/auth/auth.types.js";

export const ISSUER = "addis-eats";

// The access token: who this is and what they were allowed to do AT THE MOMENT it was issued.
// A payload is a postcard: anyone can read it, nobody can change it. No phone number, no hash.
export interface AccessPayload {
  sub: string; // the user id (a JWT "sub" is a string)
  email: string;
  roles: Role[];
  restaurantId?: number;
}

// The refresh token carries only an id and a unique id: it never authorises anything by itself
export interface RefreshPayload {
  sub: string;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number; // seconds until the access token expires
}
