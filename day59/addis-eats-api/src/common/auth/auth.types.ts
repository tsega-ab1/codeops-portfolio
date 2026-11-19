export type Role = "staff" | "customer";

// What a guard puts on the request. In week 12 a JWT guard puts the SAME shape here,
// and RolesGuard keeps working unchanged because it only ever reads request.user.
export interface AuthenticatedUser {
  id: string;
  roles: Role[];
}

// Just the parts of the HTTP request the guards use, so we need no `any`
export interface AuthRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}
