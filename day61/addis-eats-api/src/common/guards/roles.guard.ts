import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthRequest } from "../auth/auth.types.js";
import { getRequiredRoles } from "../decorators/roles.decorator.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = getRequiredRoles(this.reflector, context);
    if (!required) return true; // no @Roles = open

    const user = context.switchToHttp().getRequest<AuthRequest>().user;
    if (user?.roles.some((role) => required.includes(role))) return true;

    // THROW rather than return false: the client gets a reason, not a generic refusal
    throw new ForbiddenException(
      `This action requires the role: ${required.join(" or ")}`,
    );
  }
}
