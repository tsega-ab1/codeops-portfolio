import type { Dish } from "./dish.types.js";
import { SEED_DISHES } from "./dishes.seed.js";

export const DISH_REPOSITORY = "DISH_REPOSITORY";

export interface DishRepository {
  all(): Dish[];
  byId(id: number): Dish | undefined;
  byRestaurant(restaurantId: number): Dish[];
  save(dish: Dish): Dish;
}

export class InMemoryDishRepository implements DishRepository {
  private readonly rows = new Map<number, Dish>(
    SEED_DISHES.map((d): [number, Dish] => [d.id, d]),
  );

  all(): Dish[] {
    return [...this.rows.values()];
  }

  byId(id: number): Dish | undefined {
    return this.rows.get(id);
  }

  byRestaurant(restaurantId: number): Dish[] {
    return this.all().filter((d) => d.restaurantId === restaurantId);
  }

  save(dish: Dish): Dish {
    this.rows.set(dish.id, dish);
    return dish;
  }
}
