import { Inject, Injectable } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { AuthenticatedUser } from "../common/auth/auth.types.js";
import { OrderPolicy } from "../common/policies/order.policy.js";
import { paginate, pickFields, sortRows } from "../common/page.js";
import type { Page } from "../common/page.js";
import { DishNotOnMenuError } from "../dishes/dish.errors.js";
import { DishesService } from "../dishes/dishes.service.js";
import { RestaurantClosedError } from "../restaurants/restaurant.errors.js";
import { RestaurantsService } from "../restaurants/restaurants.service.js";
import type { CreateOrderDto } from "./dto/create-order.dto.js";
import type { FindOrdersQuery } from "./dto/find-orders.query.js";
import { InvalidTransitionError, OrderNotFoundError } from "./order.errors.js";
import { ORDER_REPOSITORY } from "./order.repository.js";
import type { OrderRepository } from "./order.repository.js";
import type { Area, Dish, Order, OrderStatus } from "./order.types.js";

// The invariant, as data. Record<OrderStatus, ...> means a sixth status is a BUILD ERROR
// until someone decides what it may become.
const ALLOWED: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PREPARING", "CANCELLED"],
  PREPARING: ["ON_THE_WAY", "CANCELLED"],
  ON_THE_WAY: ["DELIVERED"],
  DELIVERED: [], // terminal
  CANCELLED: [], // terminal
};

@Injectable()
export class OrdersService {
  // No request in sight, and no requestId argument on any method: the logger reads the id
  // from a per-request store (AsyncLocalStorage) that survives every await.
  constructor(
    @InjectPinoLogger(OrdersService.name) private readonly logger: PinoLogger,
    @Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository,
    private readonly restaurants: RestaurantsService,
    private readonly dishes: DishesService,
    private readonly policy: OrderPolicy,
  ) {}

  // A guard cannot see a LIST, so the collection is filtered here: a caller gets only the orders the policy
  // lets them read. Staff read everything, so for staff this is the whole table.
  findAll(query: FindOrdersQuery, user: AuthenticatedUser): Page<Partial<Order>> {
    return this.page(this.visibleTo(user, this.repository.all()), query);
  }

  // The parent is checked FIRST: [] for a restaurant that does not exist would be a lie
  findByRestaurant(
    restaurantId: number,
    query: FindOrdersQuery,
    user: AuthenticatedUser,
  ): Page<Partial<Order>> {
    this.restaurants.findOne(restaurantId); // throws a 404 error if it does not exist
    const rows = this.visibleTo(
      user,
      this.repository.all().filter((o) => o.restaurantId === restaurantId),
    );
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

  // Guard clauses, in a FIXED order: existence, state, relationship, then work.
  create(dto: CreateOrderDto, user: AuthenticatedUser): Order {
    // 1 - existence first: cheapest, and a 404 outranks everything else
    const restaurant = this.restaurants.findOne(dto.restaurantId);

    // 2 - the state of the thing we found
    if (!restaurant.isOpen) {
      throw new RestaurantClosedError(restaurant.id); // 409
    }

    // 3 - relationships between the things: every dish must be on THIS restaurant's menu
    const wanted = [...new Set(dto.lines.map((line) => line.dishId))];
    const menu = this.dishes.findByIds(wanted);
    const offMenu = wanted.filter(
      (id) => !menu.some((d) => d.id === id && d.restaurantId === restaurant.id),
    );
    if (offMenu.length > 0) {
      throw new DishNotOnMenuError(restaurant.id, offMenu); // 422
    }

    // 4 - only now compute and write. The price comes from the dishes, never from the client
    const items: Dish[] = dto.lines.flatMap((line) => {
      const dish = menu.find((d) => d.id === line.dishId);
      if (!dish) return [];
      return Array.from({ length: line.quantity }, () => ({
        name: dish.name,
        priceSantim: dish.priceSantim,
      }));
    });
    const totalSantim = items.reduce((sum, item) => sum + item.priceSantim, 0);
    const id = Math.max(0, ...this.repository.all().map((o) => o.id)) + 1;

    const saved = this.repository.save({
      id,
      customer: dto.customer,
      customerId: user.id, // ownership comes from the TOKEN, never from the request body
      area: dto.area,
      status: "PENDING",
      restaurantId: restaurant.id,
      paymentMethod: dto.paymentMethod,
      dishes: items,
      telebirrPhone: dto.phone,
      totalSantim,
    });

    // FIELDS, not sentences: a message you can read AND values you can filter on
    this.logger.info(
      {
        orderId: saved.id,
        restaurantId: saved.restaurantId,
        area: saved.area,
        paymentMethod: saved.paymentMethod,
        totalSantim: saved.totalSantim,
      },
      "order created",
    );
    // Detail for diagnosing, off in production. It logs a WHOLE order on purpose: the
    // careless call site that the redaction list in logger.config.ts exists to catch.
    this.logger.debug({ order: saved }, "order saved");
    return saved;
  }

  // 404 if the order is missing, 409 if its CURRENT state refuses the move
  updateStatus(id: number, next: OrderStatus): Order {
    const order = this.find(id);
    if (!ALLOWED[order.status].includes(next)) {
      throw new InvalidTransitionError(order.status, next);
    }
    const updated = this.repository.save({ ...order, status: next });
    this.logger.info({ orderId: id, from: order.status, to: next }, "order status changed");
    return updated;
  }

  // IDEMPOTENT: deleting something already gone is still a success (the caller's intent is met)
  cancel(id: number): void {
    this.repository.delete(id);
  }

  private visibleTo(user: AuthenticatedUser, rows: Order[]): Order[] {
    return rows.filter((order) => this.policy.can(user, "read", order));
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
