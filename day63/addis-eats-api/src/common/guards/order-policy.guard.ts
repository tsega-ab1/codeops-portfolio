import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { AuthRequest } from "../auth/auth.types.js";
import { POLICY_KEY } from "../decorators/check-policy.decorator.js";
import { OrderNotFoundError } from "../../orders/order.errors.js";
import type { Order } from "../../orders/order.types.js";
import { OrdersService } from "../../orders/orders.service.js";
import { OrderPolicy } from "../policies/order.policy.js";
import type { OrderAction } from "../policies/order.policy.js";

type OrderRequest = AuthRequest & { params: Record<string, string>; order?: Order };

const VERB: Record<OrderAction, string> = {
  read: "read",
  cancel: "cancel",
  updateStatus: "change the status of",
};

// Runs AFTER JwtAuthGuard and RolesGuard (global guards go first), so req.user is real and the role is right.
// It loads the order, asks the policy, and decides what to SAY about a refusal:
//   the caller may not even SEE the order -> 404, the same words as a missing one (existence is a secret)
//   the caller can see it but may not do THIS to it -> 403 (nothing is being hidden)
@Injectable()
export class OrderPolicyGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(OrderPolicyGuard.name) private readonly logger: PinoLogger,
    private readonly reflector: Reflector,
    private readonly orders: OrdersService,
    private readonly policy: OrderPolicy,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const action = this.reflector.get<OrderAction | undefined>(POLICY_KEY, context.getHandler());
    if (!action) return true;

    const req = context.switchToHttp().getRequest<OrderRequest>();
    const user = req.user;
    if (!user) return false; // cannot happen behind JwtAuthGuard; refuse rather than assume

    const id = Number(req.params.id);
    // "boom" is not an order id: the same 400 and the same words ParseIntPipe used before today
    if (!Number.isInteger(id)) throw new BadRequestException("Validation failed (numeric string is expected)");

    let order: Order;
    try {
      order = this.orders.find(id);
    } catch (error) {
      // Deleting something that is already gone is still a 204 (Day 58): keep that promise for staff
      if (error instanceof OrderNotFoundError && action === "cancel" && user.roles.includes("staff")) return true;
      throw error; // a missing order is a 404 for everybody else
    }

    if (!this.policy.can(user, "read", order)) {
      // THE TRUTH goes in the log; the caller is told only "not found"
      this.logger.warn({ userId: user.id, orderId: id, action, answered: 404 }, "access refused: order hidden from caller");
      throw new OrderNotFoundError(id);
    }
    if (!this.policy.can(user, action, order)) {
      this.logger.warn({ userId: user.id, orderId: id, action, answered: 403 }, "access refused: action not allowed");
      throw new ForbiddenException(`You are not allowed to ${VERB[action]} order ${id}`);
    }

    req.order = order; // already loaded: the handler must not load it twice
    return true;
  }
}
