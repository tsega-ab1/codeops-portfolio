import { ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { Role } from "../auth/auth.types.js";

export const ROLES_KEY = "roles";

// The decorator WRITES metadata: it does nothing at runtime except attach this array to the route
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// The guards READ it back. Handler FIRST, then the class: the first one found wins,
// so a method-level @Roles overrides a controller-level one.
// Swap the array and the controller would always win, and per-method exceptions become impossible.
export function getRequiredRoles(
  reflector: Reflector,
  context: ExecutionContext,
): Role[] | undefined {
  const required = reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);
  return required && required.length > 0 ? required : undefined;
}
