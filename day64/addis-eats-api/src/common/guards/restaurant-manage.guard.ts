import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { AuthRequest } from "../auth/auth.types.js";
import { MenuPolicy } from "../policies/menu.policy.js";
import { RestaurantsService } from "../../restaurants/restaurants.service.js";

// Runs AFTER JwtAuthGuard and RolesGuard and BEFORE the upload interceptor: a caller who may not manage this restaurant
// is refused before a single byte of a 2 MB body is read.
@Injectable()
export class RestaurantManageGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(RestaurantManageGuard.name) private readonly logger: PinoLogger,
    private readonly restaurants: RestaurantsService,
    private readonly policy: MenuPolicy,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest & { params: Record<string, string> }>();
    const user = req.user;
    if (!user) return false;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new BadRequestException("Validation failed (numeric string is expected)");

    const restaurant = this.restaurants.findOne(id); // a restaurant that does not exist is a 404 for everybody
    if (!this.policy.canManage(user, restaurant.id)) {
      this.logger.warn({ userId: user.id, restaurantId: id }, "access refused: not this user's restaurant");
      throw new ForbiddenException("You may only manage your own restaurant");
    }
    return true;
  }
}
