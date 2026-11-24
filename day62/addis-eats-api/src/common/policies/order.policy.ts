import { Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import type { Order } from "../../orders/order.types.js";

export const ORDER_ACTIONS = ["read", "cancel", "updateStatus"] as const;
export type OrderAction = (typeof ORDER_ACTIONS)[number];

// A policy is a function of THREE things: the user, the action, and the resource.
// It returns a boolean and throws nothing: the CALLER decides the status code, so a guard, a service,
// a WebSocket gateway and a unit test can all use it. Read it against the rules table:
//   staff reads/cancels anything                      -> the bypass at the top
//   a customer reads their own order                  -> "read"
//   a customer cancels their own order, only PENDING  -> "cancel"
//   a courier updates the status of THEIR orders      -> "updateStatus"
@Injectable()
export class OrderPolicy {
  can(user: AuthenticatedUser, action: OrderAction, order: Order): boolean {
    if (user.roles.includes("staff")) return true;

    switch (action) {
      case "read":
        return order.customerId === user.id || order.courierId === user.id;

      case "cancel":
        return order.customerId === user.id && order.status === "PENDING";

      case "updateStatus":
        return order.courierId === user.id && (order.status === "PREPARING" || order.status === "ON_THE_WAY");

      default: {
        // Add "refund" to ORDER_ACTIONS and THIS LINE stops compiling until somebody decides who may refund.
        // It returns false, never the value: if a bad action ever reaches here at runtime, the answer is no.
        const unreachable: never = action;
        void unreachable;
        return false;
      }
    }
  }
}
