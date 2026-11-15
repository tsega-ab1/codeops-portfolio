import { paginate, sortBy } from "../common/page.js";
import type { Page } from "../common/page.js";
import { RestaurantNotFoundError } from "../restaurants/restaurant.errors.js";
import type { CreateDishDto } from "./dto/create-dish.dto.js";
import type { DishPageQuery, FindDishesQuery } from "./dto/find-dishes.query.js";
import { DishNotFoundError, UnknownRestaurantError } from "./dish.errors.js";
import type { Dish } from "./dish.types.js";
import type { DishRepository } from "./dishes.repository.js";

export interface RestaurantLookup {
  exists(id: number): boolean;
}

export class DishesService {
  constructor(
    private readonly repo: DishRepository,
    private readonly restaurants: RestaurantLookup,
  ) {}

  findAll(q: FindDishesQuery): Page<Dish> {
    let rows = this.repo.all();
    if (q.restaurantId !== undefined) {
      rows = rows.filter((d) => d.restaurantId === q.restaurantId);
    }
    return paginate(sortBy(rows, q.sort), q);
  }

  // The parent is checked FIRST: [] for a restaurant that does not exist would be a lie
  findByRestaurant(restaurantId: number, q: DishPageQuery): Page<Dish> {
    this.requireRestaurant(restaurantId);
    return paginate(sortBy(this.repo.byRestaurant(restaurantId), q.sort), q);
  }

  // Both ids must be valid AND belong together
  findOneOfRestaurant(restaurantId: number, dishId: number): Dish {
    this.requireRestaurant(restaurantId);
    const dish = this.repo.byId(dishId);
    if (!dish || dish.restaurantId !== restaurantId) {
      throw new DishNotFoundError(dishId);
    }
    return dish;
  }

  findOne(id: number): Dish {
    const hit = this.repo.byId(id);
    if (!hit) throw new DishNotFoundError(id);
    return hit;
  }

  create(dto: CreateDishDto): Dish {
    if (!this.restaurants.exists(dto.restaurantId)) {
      throw new UnknownRestaurantError(dto.restaurantId);
    }
    const id = Math.max(0, ...this.repo.all().map((d) => d.id)) + 1;
    return this.repo.save({ ...dto, id });
  }

  private requireRestaurant(id: number): void {
    if (!this.restaurants.exists(id)) throw new RestaurantNotFoundError(id);
  }
}
