import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator.js";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    return isPublic ? true : super.canActivate(context);
  }

  // Every failure is a 401. The message tells a client WHAT to do next, without telling an attacker anything.
  handleRequest<TUser>(err: unknown, user: TUser | false, info: unknown): TUser {
    if (err || !user) {
      const reason = info instanceof Error ? info : undefined;
      if (reason?.name === "TokenExpiredError") {
        throw new UnauthorizedException("The access token has expired: call POST /auth/refresh");
      }
      if (reason?.message === "No auth token") {
        throw new UnauthorizedException("Authentication required: send an Authorization: Bearer <token> header");
      }
      throw new UnauthorizedException("Invalid access token");
    }
    return user;
  }
}
