import { Order } from "./order.types";

// The contract: what any order store must be able to do
export interface OrderRepository {
  byId(id: number): Order | undefined;
  all(): Order[];
}

// One implementation: an in-memory Map keyed by order id
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<number, Order>();

  constructor(seed: Order[] = []) {
    for (const order of seed) {
      this.orders.set(order.id, order);
    }
  }

  byId(id: number): Order | undefined {
    return this.orders.get(id);
  }

  all(): Order[] {
    return [...this.orders.values()];
  }
}
