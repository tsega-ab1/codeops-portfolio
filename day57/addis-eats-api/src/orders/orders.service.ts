import { Inject, Injectable } from "@nestjs/common";
import { paginate, pickFields, sortRows } from "../common/page.js";
import type { Page } from "../common/page.js";
import { UnknownRestaurantError } from "../restaurants/restaurant.errors.js";
import { RestaurantsService } from "../restaurants/restaurants.service.js";
import type { CreateOrderDto } from "./dto/create-order.dto.js";
import type { FindOrdersQuery } from "./dto/find-orders.query.js";
import { OrderNotFoundError } from "./order.errors.js";
import { ORDER_REPOSITORY } from "./order.repository.js";
import type { OrderRepository } from "./order.repository.js";
import type { Area, Order, OrderStatus } from "./order.types.js";

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository,
    private readonly restaurants: RestaurantsService,
  ) {}

  findAll(query: FindOrdersQuery): Page<Partial<Order>> {
    return this.page(this.repository.all(), query);
  }

  // The parent is checked FIRST: [] for a restaurant that does not exist would be a lie
  findByRestaurant(
    restaurantId: number,
    query: FindOrdersQuery,
  ): Page<Partial<Order>> {
    this.restaurants.findOne(restaurantId); // throws a 404 error if it does not exist
    const rows = this.repository
      .all()
      .filter((o) => o.restaurantId === restaurantId);
    return this.page(rows, query);
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
    if (!this.restaurants.exists(dto.restaurantId)) {
      throw new UnknownRestaurantError(dto.restaurantId);
    }
    const id = Math.max(0, ...this.repository.all().map((o) => o.id)) + 1;
    return this.repository.save({
      id,
      customer: dto.customer,
      area: dto.area,
      status: "PENDING",
      restaurantId: dto.restaurantId,
      dishes: [],
      telebirrPhone: dto.phone,
      totalSantim: dto.totalSantim,
    });
  }

  updateStatus(id: number, status: OrderStatus): Order {
    const order = this.find(id); // 404 if it does not exist
    return this.repository.save({ ...order, status });
  }

  // IDEMPOTENT: deleting something already gone is still a success (the caller's intent is met)
  cancel(id: number): void {
    this.repository.delete(id);
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

  // 1 filter  ->  2 sort  ->  3 page  ->  4 pick fields
  private page(rows: Order[], query: FindOrdersQuery): Page<Partial<Order>> {
    const { status, area, fields } = query;
    let result = rows;
    if (status) result = result.filter((o) => status.includes(o.status));
    if (area) result = result.filter((o) => area.includes(o.area));

    const page = paginate(sortRows(result, query.sort), query);
    if (!fields) return page;
    return { ...page, items: page.items.map((o) => pickFields(o, fields)) };
  }
}
