import { timingSafeEqual } from "node:crypto";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedUser, AuthRequest } from "../auth/auth.types.js";
import { getRequiredRoles } from "../decorators/roles.decorator.js";

// Constant-time comparison, so response timing cannot be used to guess a key
function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// TEMPORARY scaffolding: it lets guards be taught before authentication exists.
// 401 = I do not know who you are.   403 = I know who you are, and the answer is no.
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers["x-api-key"];
    const key = Array.isArray(header) ? header[0] : header;

    if (!key) {
      // Open routes stay open to anonymous callers. A route that declares @Roles needs an identity.
      if (getRequiredRoles(this.reflector, context)) {
        throw new UnauthorizedException("x-api-key is required"); // 401
      }
      return true;
    }

    const user = this.identify(key);
    if (!user) {
      throw new ForbiddenException("Invalid API key"); // 403: a wrong key is refused everywhere
    }
    request.user = user;
    return true;
  }

  private identify(key: string): AuthenticatedUser | undefined {
    const known: Array<[string, AuthenticatedUser]> = [
      [this.config.getOrThrow<string>("STAFF_API_KEY"), { id: "staff", roles: ["staff"] }],
      [this.config.getOrThrow<string>("CUSTOMER_API_KEY"), { id: "customer", roles: ["customer"] }],
    ];
    return known.find(([secret]) => safeEqual(secret, key))?.[1];
  }
}
