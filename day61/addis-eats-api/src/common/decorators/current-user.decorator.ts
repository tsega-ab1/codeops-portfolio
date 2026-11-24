import { ExecutionContext, UnauthorizedException, createParamDecorator } from "@nestjs/common";
import type { AuthenticatedUser, AuthRequest } from "../auth/auth.types.js";

// @CurrentUser() user: AuthenticatedUser  ->  what the JWT strategy's validate() returned
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const user = context.switchToHttp().getRequest<AuthRequest>().user;
    if (!user) throw new UnauthorizedException();
    return user;
  },
);
