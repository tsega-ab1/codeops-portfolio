import { OrderNotFoundError } from "./order.errors";
import { OrderRepository } from "./order.repository";
import { Area, Order } from "./order.types";

export class OrderService {
  // `private readonly` in the constructor declares AND assigns the field
  constructor(private readonly repository: OrderRepository) {}

  // Throws a typed error instead of returning undefined
  find(id: number): Order {
    const order = this.repository.byId(id);
    if (order === undefined) {
      throw new OrderNotFoundError(id);
    }
    return order;
  }

  // Record<Area, number> means a missing area is a build error
  feesByArea(): Record<Area, number> {
    return {
      Bole: 4000,
      Kazanchis: 6000,
      Piassa: 6000,
      Megenagna: 6000,
    };
  }

  // Generic: the key picks the property, the return type follows it
  summarise<K extends keyof Order>(key: K): Order[K][] {
    return this.repository.all().map((order) => order[key]);
  }
}
