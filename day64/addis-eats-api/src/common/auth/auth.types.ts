// A real array AND a type (Day 53): the array lets a validator check a value at runtime
export const ROLES = ["customer", "courier", "restaurant", "staff"] as const;
export type Role = (typeof ROLES)[number];

// What the JWT strategy puts on the request (req.user). Guards and policies only ever read this.
export interface AuthenticatedUser {
  id: number;
  email: string;
  roles: Role[];
  restaurantId?: number; // only for the restaurant role: whose menu it may manage (a snapshot, like the roles)
}

// Just the parts of the HTTP request the guards use, so we need no `any`
export interface AuthRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}
