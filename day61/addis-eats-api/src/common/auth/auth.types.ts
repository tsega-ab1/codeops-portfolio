export type Role = "staff" | "customer";

// What the JWT strategy puts on the request (req.user). RolesGuard only ever reads this.
export interface AuthenticatedUser {
  id: number;
  email: string;
  roles: Role[];
}

// Just the parts of the HTTP request the guards use, so we need no `any`
export interface AuthRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}
