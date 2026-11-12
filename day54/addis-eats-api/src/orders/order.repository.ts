import { Injectable } from "@nestjs/common";
import type { Order } from "./order.types.js";
import { SEED_ORDERS } from "./orders.seed.js";

// An interface is erased at build time, so the container needs a token
export const ORDER_REPOSITORY = "ORDER_REPOSITORY";

export interface OrderRepository {
  byId(id: number): Order | undefined;
  all(): Order[];
  save(order: Order): Order;
}

@Injectable()
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<number, Order>(
    SEED_ORDERS.map((order): [number, Order] => [order.id, order]),
  );

  byId(id: number): Order | undefined {
    return this.orders.get(id);
  }

  all(): Order[] {
    return [...this.orders.values()];
  }

  save(order: Order): Order {
    this.orders.set(order.id, order);
    return order;
  }
}
