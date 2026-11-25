import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import type { Order } from "../../orders/order.types.js";

// @CurrentOrder() order: Order  ->  the order OrderPolicyGuard already loaded and checked.
// The guard has paid for the lookup, so the handler does not repeat it.
export const CurrentOrder = createParamDecorator((_data: unknown, context: ExecutionContext): Order => {
  const order = context.switchToHttp().getRequest<{ order?: Order }>().order;
  if (!order) throw new Error("@CurrentOrder() needs @CheckPolicy() on the same route");
  return order;
});
