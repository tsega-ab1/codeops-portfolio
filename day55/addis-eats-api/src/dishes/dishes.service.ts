import type { CreateDishDto } from "./dto/create-dish.dto.js";
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

  findAll(restaurantId?: number): Dish[] {
    return restaurantId === undefined
      ? this.repo.all()
      : this.repo.byRestaurant(restaurantId);
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
}
