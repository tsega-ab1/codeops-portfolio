import { ImageService } from "../common/images/image.service.js";
import { matchesText, paginate, sortRows } from "../common/page.js";
import type { Page } from "../common/page.js";
import { RestaurantNotFoundError } from "../restaurants/restaurant.errors.js";
import type { CreateDishDto } from "./dto/create-dish.dto.js";
import type { DishPageQuery, FindDishesQuery } from "./dto/find-dishes.query.js";
import { DishNotFoundError } from "./dish.errors.js";
import type { Dish } from "./dish.types.js";
import type { DishRepository } from "./dishes.repository.js";

export interface RestaurantLookup {
  exists(id: number): boolean;
}

export class DishesService {
  constructor(
    private readonly repo: DishRepository,
    private readonly restaurants: RestaurantLookup,
    private readonly images: ImageService,
  ) {}

  findAll(query: FindDishesQuery): Page<Dish> {
    let rows = this.repo.all();
    if (query.restaurantId !== undefined) {
      rows = rows.filter((d) => d.restaurantId === query.restaurantId);
    }
    return this.refine(rows, query);
  }

  // The parent is checked FIRST: [] for a restaurant that does not exist would be a lie
  findByRestaurant(restaurantId: number, query: DishPageQuery): Page<Dish> {
    this.requireRestaurant(restaurantId);
    return this.refine(this.repo.byRestaurant(restaurantId), query);
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

  // The dishes that exist; ids that do not exist are simply missing from the answer
  findByIds(ids: readonly number[]): Dish[] {
    return ids
      .map((id) => this.repo.byId(id))
      .filter((dish): dish is Dish => dish !== undefined);
  }

  findOne(id: number): Dish {
    const hit = this.repo.byId(id);
    if (!hit) throw new DishNotFoundError(id);
    return hit;
  }

  // Existence outranks everything: a restaurant that is not there is a 404
  create(dto: CreateDishDto): Dish {
    this.requireRestaurant(dto.restaurantId);
    const id = Math.max(0, ...this.repo.all().map((d) => d.id)) + 1;
    // every field by NAME: a spread would let any extra property in the body become part of the record
    return this.repo.save({ id, name: dto.name, priceSantim: dto.priceSantim, restaurantId: dto.restaurantId });
  }

  async setImage(id: number, file: Express.Multer.File): Promise<Dish> {
    const dish = this.findOne(id);
    await this.images.attach(file, "dishes", dish.image, (image) => {
      this.repo.save({ ...dish, image });
    });
    return this.findOne(id);
  }

  private requireRestaurant(id: number): void {
    if (!this.restaurants.exists(id)) throw new RestaurantNotFoundError(id);
  }

  // search  ->  sort  ->  page
  private refine(rows: Dish[], query: DishPageQuery): Page<Dish> {
    const { q } = query;
    const found = q ? rows.filter((d) => matchesText(d.name, q)) : rows;
    return paginate(sortRows(found, query.sort), query);
  }
}
