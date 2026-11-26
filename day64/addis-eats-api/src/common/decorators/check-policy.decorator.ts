import { SetMetadata, UseGuards, applyDecorators } from "@nestjs/common";
import { OrderPolicyGuard } from "../guards/order-policy.guard.js";
import type { OrderAction } from "../policies/order.policy.js";

export const POLICY_KEY = "orderPolicyAction";

// One decorator does both jobs: it WRITES the action as metadata (Day 59's pattern) and attaches the guard
// that READS it. A route marked @CheckPolicy("cancel") cannot forget its guard.
export const CheckPolicy = (action: OrderAction) =>
  applyDecorators(SetMetadata(POLICY_KEY, action), UseGuards(OrderPolicyGuard));
