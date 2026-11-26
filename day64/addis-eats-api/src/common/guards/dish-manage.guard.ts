import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { AuthRequest } from "../auth/auth.types.js";
import { MenuPolicy } from "../policies/menu.policy.js";
import { DishesService } from "../../dishes/dishes.service.js";

// The same decision for a dish: it belongs to a restaurant, and only that restaurant's users (or staff) may manage it.
@Injectable()
export class DishManageGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(DishManageGuard.name) private readonly logger: PinoLogger,
    private readonly dishes: DishesService,
    private readonly policy: MenuPolicy,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest & { params: Record<string, string> }>();
    const user = req.user;
    if (!user) return false;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new BadRequestException("Validation failed (numeric string is expected)");

    const dish = this.dishes.findOne(id); // 404 if the dish does not exist
    if (!this.policy.canManage(user, dish.restaurantId)) {
      this.logger.warn({ userId: user.id, dishId: id, restaurantId: dish.restaurantId }, "access refused: not this user's menu");
      throw new ForbiddenException("You may only manage dishes on your own restaurant's menu");
    }
    return true;
  }
}
