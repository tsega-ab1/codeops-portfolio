import { Inject, Injectable } from "@nestjs/common";
import type { CreateOrderDto } from "./dto/create-order.dto.js";
import { OrderNotFoundError } from "./order.errors.js";
import { ORDER_REPOSITORY } from "./order.repository.js";
import type { OrderRepository } from "./order.repository.js";
import type { Area, Order } from "./order.types.js";

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository,
  ) {}

  findAll(): Order[] {
    return this.repository.all();
  }

  // Throws a typed error instead of returning undefined
  find(id: number): Order {
    const order = this.repository.byId(id);
    if (order === undefined) {
      throw new OrderNotFoundError(id);
    }
    return order;
  }

  create(dto: CreateOrderDto): Order {
    const id = Math.max(0, ...this.repository.all().map((o) => o.id)) + 1;
    return this.repository.save({
      id,
      customer: dto.customer,
      area: dto.area,
      status: "PENDING",
      dishes: [],
      telebirrPhone: dto.phone,
      totalSantim: dto.totalSantim,
    });
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
